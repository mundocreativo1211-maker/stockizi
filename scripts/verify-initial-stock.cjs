// Prueba opcional con PostgreSQL REAL aislado. No lee .env ni usa el puerto 5432.
// Ejecutar: node scripts/verify-initial-stock.cjs
// Crea una carpeta temporal, inicia su propio servidor y lo detiene al terminar.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { once } = require('node:events');
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const { createApi } = require('../server/app');

(async () => {
  const bin = process.env.STOCKIZI_TEST_PG_BIN || 'C:/Program Files/PostgreSQL/18/bin';
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'stockizi-pg-test-'));
  const data = path.join(folder, 'data');
  const pgctl = path.join(bin, 'pg_ctl.exe');
  // No heredar pipes hacia el servidor: en Windows impediría cerrar pg_ctl.
  const command = (file, args) => execFileSync(file, args, { windowsHide: true, stdio: 'ignore', timeout: 30000 });
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  let started = false, admin, editor, api;
  try {
    command(path.join(bin, 'initdb.exe'), ['-D', data, '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--locale=C']);
    started = true;
    command(pgctl, ['-D', data, '-l', path.join(folder, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', '-t', '15', 'start']);
    const config = { host: '127.0.0.1', port, user: 'postgres', database: 'postgres', connectionTimeoutMillis: 3000 };
    admin = new Pool(config);
    await admin.query('CREATE DATABASE stockizi_dev');
    await admin.end();
    admin = new Pool({ ...config, database: 'stockizi_dev' });
    for (const file of ['001_create_products.sql', '002_create_reader.sql', '003_enable_product_editing.sql']) {
      await admin.query(fs.readFileSync(path.join(__dirname, '../database', file), 'utf8'));
    }
    const old = (await admin.query("INSERT INTO public.products (name,cost_price,sale_price,stock) VALUES ('Anterior',1,2,-3) RETURNING id::text")).rows[0];
    await admin.query(fs.readFileSync(path.join(__dirname, '../database/004_initial_stock.sql'), 'utf8'));
    assert.equal((await admin.query('SELECT count(*)::int AS n FROM public.stock_movements')).rows[0].n, 0);
    assert.equal((await admin.query('SELECT stock FROM public.products WHERE id=$1', [old.id])).rows[0].stock, '-3');
    editor = new Pool({ ...config, database: 'stockizi_dev', user: 'stockizi_editor' });
    api = createApi(editor);
    api.listen(0, '127.0.0.1');
    await once(api, 'listening');
    const base = `http://127.0.0.1:${api.address().port}`;
    const input = { name: 'Azúcar prueba', costPrice: '1220', salePrice: '1900', stock: '1.200', unit: 'KILOGRAM', requestId: randomUUID() };
    const post = value => fetch(`${base}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
    const responses = await Promise.all(Array.from({ length: 8 }, () => post(input)));
    assert.equal(responses.filter(response => response.status === 201).length, 1);
    assert.ok(responses.every(response => [200, 201].includes(response.status)));
    const products = await Promise.all(responses.map(response => response.json()));
    assert.equal(new Set(products.map(result => result.product.id)).size, 1);
    const product = products[0].product;
    assert.equal(product.stock, '1.2');
    assert.equal(product.markupPercentage, '55.74');
    const movements = (await admin.query('SELECT * FROM public.stock_movements WHERE product_id=$1', [product.id])).rows;
    assert.equal(movements.length, 1);
    assert.equal(movements[0].quantity, '1.2');
    assert.equal(movements[0].stock_after, '1.2');
    assert.equal(movements[0].kind, 'INITIAL');
    assert.equal(movements[0].unit, 'KILOGRAM');
    assert.ok(movements[0].created_at);
    assert.equal((await post({ ...input, name: 'Otro' })).status, 409);
    assert.equal((await post({ ...input, requestId: randomUUID(), unit: 'UNIT' })).status, 400);
    for (const stock of ['-1', '1.0001', 'NaN']) {
      assert.equal((await post({ ...input, requestId: randomUUID(), stock })).status, 400);
    }
    const zero = await post({ ...input, requestId: randomUUID(), stock: '0', unit: 'UNIT' });
    assert.equal(zero.status, 201);
    const zeroId = (await zero.json()).product.id;
    assert.equal((await admin.query('SELECT quantity FROM public.stock_movements WHERE product_id=$1', [zeroId])).rows[0].quantity, '0');
    await assert.rejects(editor.query('UPDATE public.products SET stock=2 WHERE id=$1', [product.id]), { code: '42501' });
    await assert.rejects(editor.query('DELETE FROM public.stock_movements'), { code: '42501' });
    await assert.rejects(editor.query("INSERT INTO public.stock_movements (product_id,kind,quantity,unit,stock_after) VALUES ($1,'INITIAL',9,'UNIT',9)", [old.id]), { code: '42501' });
    // Fuerza un fallo del movimiento para comprobar que tampoco queda el alta.
    await admin.query('ALTER TABLE public.stock_movements ADD CONSTRAINT test_fail CHECK (quantity <> 7)');
    const failing = { ...input, requestId: randomUUID(), stock: '7' };
    assert.equal((await post(failing)).status, 503);
    assert.equal((await admin.query('SELECT count(*)::int AS n FROM public.products WHERE creation_key=$1', [failing.requestId])).rows[0].n, 0);
    await admin.query('ALTER TABLE public.stock_movements DROP CONSTRAINT test_fail');
    assert.equal((await post(failing)).status, 201);
    const patch = await fetch(`${base}/api/products/${product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Azúcar editada', costPrice: '1220', salePrice: '2000', expected: { name: product.name, costPrice: product.costPrice, salePrice: product.salePrice } }) });
    assert.equal(patch.status, 200);
    assert.equal((await patch.json()).product.stock, '1.2');
    assert.equal((await admin.query('SELECT count(*)::int AS n FROM public.stock_movements WHERE product_id=$1', [product.id])).rows[0].n, 1);
    await admin.query(fs.readFileSync(path.join(__dirname, '../database/005_categories.sql'), 'utf8'));
    await require('./check-categories.cjs')({ base, admin, editor, oldId: old.id });
    await admin.query(fs.readFileSync(path.join(__dirname, '../database/006_product_codes.sql'), 'utf8'));
    await require('./check-codes.cjs')({ base, admin, editor, oldId: old.id });
    await require('./check-strict-prices.cjs')({ base, admin, editor });
    if (process.argv.includes('--electron')) {
      const readback = await fetch(`${base}/api/products`);
      const readData = await readback.json();
      assert.equal(readback.status, 200, JSON.stringify(readData));
      try { require('../api-client').validatePage(readData, '0'); }
      catch (error) { throw new Error(`Catálogo de prueba inválido: ${JSON.stringify(readData)}`, { cause: error }); }
      const runtime = process.env.STOCKIZI_TEST_PLAYWRIGHT || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
      const { _electron: electron } = require(runtime);
      const env = { ...process.env, API_PORT: String(api.address().port) };
      delete env.ELECTRON_RUN_AS_NODE;
      const app = await electron.launch({
        executablePath: path.join(__dirname, '../node_modules/electron/dist/electron.exe'),
        args: [`--user-data-dir=${path.join(folder, 'electron')}`, path.resolve(__dirname, '..')], env,
      });
      try {
        const page = await app.firstWindow();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.reload();
        await page.waitForFunction(() => !document.querySelector('#refresh-products').disabled);
        const state = await page.evaluate(() => ({ status: document.querySelector('#connection-status').textContent,
          bridge: Object.keys(window.stockizi || {}) }));
        if (!state.status.startsWith('Datos consultados')) {
          console.log('Diagnóstico de prueba', JSON.stringify(await app.evaluate(() => ({ port: process.env.API_PORT }))));
          console.log('Respuesta puente', JSON.stringify(await page.evaluate(() => window.stockizi.listProducts('0'))));
        }
        assert.match(state.status, /^Datos consultados/, JSON.stringify({ state, errors }));
        await page.locator('[data-section="products"]').click();
        await page.locator('#new-product').click();
        await page.locator('#product-name').fill('Alta desde ventana');
        await page.locator('#product-cost-price').fill('100');
        await page.locator('#product-markup').fill('50');
        assert.equal(await page.locator('#product-sale-price').inputValue(), '150.00');
        await page.locator('#product-stock').fill('1.2');
        assert.equal(await page.locator('#save-product').isDisabled(), true);
        await page.locator('#product-unit').selectOption('KILOGRAM');
        await page.locator('#save-product').click();
        await page.waitForFunction(() => document.querySelector('#product-form-status').textContent.includes('Stock inicial quedó registrado'));
        assert.equal(await page.locator('#product-stock').isDisabled(), true);
        assert.equal(await page.locator('#product-unit').isDisabled(), true);
        await page.locator('#refresh-products').click();
        await page.waitForFunction(() => !document.querySelector('#refresh-products').disabled);
        assert.equal(await page.locator('#product-name').inputValue(), 'Alta desde ventana');
        const saved = (await admin.query("SELECT p.stock, m.quantity FROM public.products p JOIN public.stock_movements m ON m.product_id=p.id WHERE p.name='Alta desde ventana'")).rows;
        assert.deepEqual(saved, [{ stock: '1.2', quantity: '1.2' }]);
        await page.locator('#product-cost-price').fill('120');
        assert.equal(await page.locator('#product-sale-price').inputValue(), '180.00');
        assert.equal(await page.locator('#product-markup').inputValue(), '50.00');
        await page.locator('#product-markup').fill('50');
        assert.equal(await page.locator('#product-sale-price').inputValue(), '180.00');
        await page.locator('#save-product').click();
        await page.waitForFunction(() => document.querySelector('#product-form-status').textContent.includes('Cambios guardados'));
        await page.locator('#refresh-products').click();
        await page.waitForFunction(() => !document.querySelector('#refresh-products').disabled);
        assert.equal(await page.locator('#product-sale-price').inputValue(), '180.00');
        assert.equal(await page.locator('#product-markup').inputValue(), '50.00');
        await require('./check-categories.cjs').window(page, admin);
        await require('./check-codes.cjs').window(page, admin);
        await require('./check-product-search.cjs')(page, admin, base);
        await require('./check-exit-guard.cjs')(app, page, admin);
        await page.screenshot({ path: path.join(folder, 'new-product.png') });
        assert.deepEqual(errors, []);
        console.log(`OK: Electron + IPC + API + PostgreSQL real. Captura: ${path.join(folder, 'new-product.png')}`);
      } finally {
        // Limpieza exclusiva de ventanas de esta instancia de prueba, aun si
        // falló una aserción dejando un borrador que impediría el cierre normal.
        await app.evaluate(({ BrowserWindow }) => {
          for (const win of BrowserWindow.getAllWindows()) win.destroy();
        }).catch(() => {});
        await app.close();
      }
    }
    console.log('OK: migraciones, alta y movimiento atómicos, permisos, cero, kilos, validación, 8 reintentos concurrentes sin duplicados y edición existente.');
  } finally {
    if (api) { api.closeAllConnections(); await new Promise(resolve => api.close(resolve)); }
    if (editor) await editor.end();
    if (admin) await admin.end();
    if (started) command(pgctl, ['-D', data, '-m', 'fast', '-w', '-t', '15', 'stop']);
    console.log(`Servidor de prueba detenido. Archivos temporales conservados en: ${folder}`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
