const assert = require('node:assert/strict');

module.exports = async (page, admin, base) => {
  // Se ejecuta después de las pruebas de códigos, que crean más de 100 filas.
  const category = (await admin.query("INSERT INTO public.categories(name) VALUES('Búsqueda aislada') RETURNING id::text")).rows[0].id;
  const child = (await admin.query("INSERT INTO public.subcategories(name,category_id) VALUES('Grupo', $1) RETURNING id::text", [category])).rows[0].id;
  const id = (await admin.query("INSERT INTO public.products(name,cost_price,sale_price,category_id,subcategory_id) VALUES('ÁZÚCAR especial 100%_azul',1,2,$1,$2) RETURNING id::text", [category, child])).rows[0].id;
  const request = async filters => {
    const response = await fetch(`${base}/api/products?${new URLSearchParams(filters)}`);
    assert.equal(response.status, 200);
    return response.json();
  };
  assert.deepEqual((await request({ name: 'azucar especial', categoryId: category, subcategoryId: child })).products.map(p => p.id), [id]);
  assert.deepEqual((await request({ name: '%_' })).products.map(p => p.id), [id]);
  assert.equal((await request({ name: "' OR 1=1 --" })).products.length, 0);
  assert.equal((await request({ name: 'especial', categoryId: category, subcategoryId: '9223372036854775807' })).products.length, 0);
  const first = await request({ name: 'relleno' });
  assert.equal(first.products.length, 100);
  const second = await request({ name: 'relleno', afterId: first.nextAfterId });
  assert.equal(second.products.length, 5);
  assert.equal(second.nextAfterId, null);
  assert.equal(new Set([...first.products, ...second.products].map(p => p.id)).size, 105);
  await page.locator('#clear-filters').click();
  await page.waitForFunction(() => !document.querySelector('#refresh-products').disabled);
  assert.equal(await page.getByRole('button', { name: /ÁZÚCAR especial/ }).count(), 0);
  await page.locator('#product-search').fill('azucar especial');
  await page.locator('#category-filter').selectOption(category);
  await page.locator('#subcategory-filter').selectOption(child);
  await page.locator('#product-search').press('Enter');
  await page.waitForFunction(() => !document.querySelector('#refresh-products').disabled);
  assert.equal(await page.locator('.product-row').count(), 1);
  await page.locator('.product-row').click();
  assert.equal(await page.locator('#product-name').inputValue(), 'ÁZÚCAR especial 100%_azul');
  // Restaurar el producto que espera la siguiente prueba de cierre.
  await page.locator('#code-search').fill('LEJOS-001');
  await page.locator('#find-code').click();
  await page.waitForFunction(() => document.querySelector('#product-name').value === 'Fuera de página');
  console.log('OK: búsqueda completa literal sin tildes, rubro/subcategoría, paginación filtrada y producto fuera de página en Electron.');
};
