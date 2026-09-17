const assert = require('node:assert/strict');

// Ejecuta cierre/recarga reales de Electron. Solo la respuesta del diálogo
// nativo se simula, para que la prueba no necesite clics humanos.
module.exports = async (app, page, admin) => {
  // Electron cancela beforeunload sin diálogo Chromium. Evitar que Playwright
  // intente aceptar automáticamente ese aviso ya resuelto por Electron.
  const chromiumDialog = () => {};
  page.on('dialog', chromiumDialog);
  await app.evaluate(({ dialog }) => {
    globalThis.exitTest = { calls: [], answer: 0, original: dialog.showMessageBoxSync };
    dialog.showMessageBoxSync = (_owner, options) => {
      globalThis.exitTest.calls.push(options);
      return globalThis.exitTest.answer;
    };
  });
  const count = () => app.evaluate(() => globalThis.exitTest.calls.length);
  const attempt = async (kind = 'reload', answer = 0) => {
    console.log(`Prueba salida: ${kind}, respuesta ${answer}`);
    const before = await count();
    await app.evaluate(({ BrowserWindow }, { kind, answer }) => {
      globalThis.exitTest.answer = answer;
      const win = BrowserWindow.getAllWindows()[0];
      if (kind === 'close') win.close(); else win.webContents.reload();
    }, { kind, answer });
    // Lecturas acotadas, no sleeps largos; espera hasta que beforeunload responda.
    for (let i = 0; i < 100 && await count() === before; i++) {
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.equal(await count(), before + 1);
    return app.evaluate(() => globalThis.exitTest.calls.at(-1));
  };
  try {
    await page.locator('#product-name').fill('Borrador que no se pierde');
    assert.equal((await attempt('close')).title, 'Cambios sin guardar');
    assert.equal(await page.locator('#product-name').inputValue(), 'Borrador que no se pierde');
    assert.equal((await attempt()).title, 'Cambios sin guardar');
    assert.equal(await page.locator('#product-name').inputValue(), 'Borrador que no se pierde');
    await page.locator('#cancel-product').click();
    await page.locator('#manage-categories').click();
    await page.locator('#category-name').fill('Rubro sin guardar');
    assert.equal((await attempt()).title, 'Cambios sin guardar');
    await page.locator('#close-categories').click();
    await page.locator('#manage-codes').click();
    await page.waitForFunction(() => !document.querySelector('#add-code').disabled);
    await page.locator('#new-code').fill('CODIGO-PENDIENTE');
    assert.equal((await attempt()).title, 'Cambios sin guardar');
    await page.locator('#close-codes').click();

    const lock = await admin.connect();
    try {
      await lock.query('BEGIN');
      await lock.query("SELECT id FROM public.products WHERE name='Fuera de página' FOR UPDATE");
      await page.locator('#product-name').fill('Guardado protegido');
      await page.locator('#save-product').click();
      await page.waitForFunction(() => document.querySelector('#product-form-status').textContent.includes('Guardando'));
      assert.equal((await attempt('close', 1)).title, 'Operación en curso');
      assert.equal((await attempt('reload', 1)).title, 'Operación en curso');
    } finally { await lock.query('ROLLBACK'); lock.release(); }
    await page.waitForFunction(() => document.querySelector('#product-form-status').textContent.includes('Cambios guardados'));
    const before = await count();
    await page.reload();
    await page.waitForFunction(() => !document.querySelector('#refresh-products').disabled);
    assert.equal(await count(), before); // Guardado exitoso deja el borrador limpio.
    await page.locator('[data-section="products"]').click();
    await page.locator('#new-product').click();
    await page.locator('#product-name').fill('Alta descartada');
    await attempt('reload', 1);
    await page.waitForFunction(() => !document.querySelector('#refresh-products').disabled && document.querySelector('#product-name').value === '');
    assert.equal((await admin.query("SELECT count(*)::int AS n FROM public.products WHERE name='Alta descartada'")).rows[0].n, 0);
    console.log('OK: cierre/recarga cancelados conservan borradores; guardado real bloquea salida; descartar recarga no guarda.');
  } finally {
    page.off('dialog', chromiumDialog);
    await app.evaluate(({ dialog }) => { dialog.showMessageBoxSync = globalThis.exitTest.original; delete globalThis.exitTest; });
  }
};
