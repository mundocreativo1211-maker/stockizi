const assert = require('node:assert/strict');

module.exports = async ({ base, admin, editor, oldId }) => {
  const request = (path, method = 'GET', body) => fetch(`${base}/api/${path}`, {
    method, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  const before = (await admin.query('SELECT id,stock FROM public.products ORDER BY id')).rows;
  const movementCount = (await admin.query('SELECT count(*) FROM public.stock_movements')).rows[0].count;
  const replies = await Promise.all(Array.from({ length: 8 }, () => request(`products/${oldId}/codes`, 'POST', { code: '00123' })));
  assert.equal(replies.filter(result => result.status === 201).length, 1);
  assert.ok(replies.every(result => [200, 201].includes(result.status)));
  const items = await Promise.all(replies.map(async result => (await result.json()).item));
  assert.equal(new Set(items.map(item => item.id)).size, 1);
  assert.equal((await request(`products/${oldId}/codes`, 'POST', { code: 'Aa-005' })).status, 201);
  assert.equal((await request('products/by-code?code=00123').then(result => result.json())).product.id, oldId);
  assert.equal((await request('products/by-code?code=123').then(result => result.json())).product, null);
  assert.equal((await request('products/by-code?code=aa-005').then(result => result.json())).product, null);
  const otherId = before.find(row => row.id !== oldId).id;
  assert.equal((await request(`products/${otherId}/codes`, 'POST', { code: '00123' })).status, 409);
  assert.equal((await request(`products/${otherId}/codes/${items[0].id}`, 'DELETE')).status, 404);
  assert.equal((await request(`products/${oldId}/codes/${items[0].id}`, 'DELETE')).status, 200);
  assert.equal((await request('products/by-code?code=00123').then(result => result.json())).product, null);
  const reassigned = await request(`products/${otherId}/codes`, 'POST', { code: '00123' });
  assert.equal(reassigned.status, 201);
  assert.equal((await request(`products/${oldId}/codes/${items[0].id}`, 'DELETE')).status, 200);
  assert.equal((await request('products/by-code?code=00123').then(result => result.json())).product.id, otherId);
  await assert.rejects(editor.query('UPDATE public.product_codes SET product_id=$1', [otherId]), { code: '42501' });
  await assert.rejects(editor.query('DELETE FROM public.product_codes'), { code: '42501' });
  await assert.rejects(editor.query('INSERT INTO public.product_codes(product_id,code) VALUES($1,$2)', [otherId, 'Aa-005']), { code: '23505' });
  assert.deepEqual((await admin.query('SELECT id,stock FROM public.products ORDER BY id')).rows, before);
  assert.equal((await admin.query('SELECT count(*) FROM public.stock_movements')).rows[0].count, movementCount);
  console.log('OK: códigos múltiples, ceros, mayúsculas, unicidad concurrente, retiro y permisos sin modificar stock.');
};

module.exports.window = async (page, admin) => {
  await page.locator('#manage-codes').click();
  await page.waitForFunction(() => !document.querySelector('#add-code').disabled);
  for (const code of ['00042', 'ABC-42']) {
    await page.locator('#new-code').fill(code);
    await page.locator('#add-code').click();
    await page.waitForFunction(() => document.querySelector('#codes-status').textContent === 'Código guardado.');
  }
  assert.equal(await page.locator('#codes-list li').count(), 2);
  await page.locator('#close-codes').click();
  // Borrador sin guardar: buscar no debe reemplazarlo.
  await page.locator('#product-name').fill('Borrador protegido');
  await page.locator('#code-search').fill('00042');
  await page.locator('#find-code').click();
  assert.match(await page.locator('#form-error').textContent(), /sin guardar/);
  assert.equal(await page.locator('#product-name').inputValue(), 'Borrador protegido');
  await page.locator('#cancel-product').click();
  await page.locator('#find-code').click();
  await page.waitForFunction(() => document.querySelector('#code-search-status').textContent.startsWith('Encontrado:'));
  assert.equal(await page.locator('#product-name').inputValue(), 'Alta desde ventana');
  await page.locator('#manage-codes').click();
  await page.waitForFunction(() => !document.querySelector('#add-code').disabled);
  await page.getByRole('button', { name: 'Quitar 00042', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar quitar 00042', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#codes-status').textContent.startsWith('Código quitado'));
  await page.locator('#close-codes').click();
  await page.locator('#find-code').click();
  await page.waitForFunction(() => document.querySelector('#code-search-status').textContent.startsWith('Sin resultados'));
  assert.equal(await page.locator('.product-row').count(), 0);
  assert.equal(await page.locator('#load-more-products').isVisible(), false);
  assert.equal(await page.locator('#product-name').inputValue(), 'Alta desde ventana');
  await page.locator('#code-search').fill('ABC-42');
  await page.locator('#find-code').click();
  await page.waitForFunction(() => document.querySelector('#code-search-status').textContent.startsWith('Encontrado:'));
  assert.equal(await page.locator('.product-row').count(), 1);
  // Producto fuera de la primera página: la búsqueda debe traerlo igual.
  await admin.query("INSERT INTO public.products(name,cost_price,sale_price) SELECT 'Relleno '||n,1,2 FROM generate_series(1,105) n");
  const remoteId = (await admin.query("INSERT INTO public.products(name,cost_price,sale_price) VALUES('Fuera de página',1,2) RETURNING id::text")).rows[0].id;
  await admin.query('INSERT INTO public.product_codes(product_id,code) VALUES($1,$2)', [remoteId, 'LEJOS-001']);
  await page.locator('#refresh-products').click();
  await page.waitForFunction(() => !document.querySelector('#refresh-products').disabled);
  assert.equal(await page.getByRole('button', { name: /Fuera de página/ }).count(), 0);
  await page.locator('#code-search').fill('LEJOS-001');
  await page.locator('#find-code').click();
  await page.waitForFunction(() => document.querySelector('#product-name').value === 'Fuera de página');
  assert.equal(await page.locator('#product-stock').inputValue(), '0');
  const layout = await page.evaluate(() => ({
    list: document.querySelector('.catalog-scroll').getBoundingClientRect().height,
    moreBottom: document.querySelector('#load-more-products').getBoundingClientRect().bottom,
    formTop: document.querySelector('#product-form').getBoundingClientRect().top,
  }));
  assert.ok(layout.list >= 120 && layout.moreBottom <= layout.formTop, JSON.stringify(layout));
  console.log('OK: ventana códigos, borrador protegido, retiro confirmado y búsqueda fuera de primera página.');
};
