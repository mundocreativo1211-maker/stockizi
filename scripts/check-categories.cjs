// Se ejecuta dentro del PostgreSQL temporal de verify-initial-stock.cjs.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

module.exports = async function checkCategories({ base, admin, editor, oldId }) {
  const request = (route, body, method = 'POST') => fetch(`${base}/api/${route}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const category = async (name, categoryId) => {
    const response = await request(categoryId ? 'subcategories' : 'categories', categoryId ? { name, categoryId } : { name });
    assert.ok([200, 201].includes(response.status));
    return (await response.json()).item;
  };
  const root = await category('Repostería');
  assert.equal((await category('REPOSTERÍA')).id, root.id);
  const other = await category('Papelera');
  const child = await category('Insumos', root.id);
  assert.notEqual((await category('Insumos', other.id)).id, child.id);
  const input = { name: 'Producto clasificado', costPrice: '1', salePrice: '2', unit: 'UNIT', stock: '4', requestId: randomUUID(), categoryId: root.id, subcategoryId: child.id };
  const created = await request('products', input);
  assert.equal(created.status, 201);
  const product = (await created.json()).product;
  assert.equal(product.categoryId, root.id);
  assert.equal(product.subcategoryId, child.id);
  assert.equal((await request('products', { ...input, requestId: randomUUID(), categoryId: other.id })).status, 400);
  assert.equal((await request('products', { ...input, requestId: randomUUID(), categoryId: null })).status, 400);
  // También la base impide vínculos cruzados, no solamente el formulario.
  await assert.rejects(editor.query('UPDATE public.products SET category_id=$1 WHERE id=$2', [other.id, product.id]), { code: '23503' });
  const renamed = await request(`categories/${root.id}`, { name: 'Repostería propia', expectedName: 'Repostería' }, 'PATCH');
  assert.equal(renamed.status, 200);
  assert.equal((await request(`categories/${root.id}`, { name: 'Otro', expectedName: 'Repostería' }, 'PATCH')).status, 409);
  assert.equal((await request(`categories/${other.id}`, { name: 'Repostería propia', expectedName: 'Papelera' }, 'PATCH')).status, 409);
  assert.equal((await request(`subcategories/${child.id}`, { name: 'Ingredientes', expectedName: 'Insumos' }, 'PATCH')).status, 200);
  const values = { name: product.name, costPrice: product.costPrice, salePrice: product.salePrice,
    categoryId: other.id, subcategoryId: null,
    expected: { name: product.name, costPrice: product.costPrice, salePrice: product.salePrice, categoryId: root.id, subcategoryId: child.id } };
  const changed = await request(`products/${product.id}`, values, 'PATCH');
  assert.equal(changed.status, 200);
  assert.equal((await changed.json()).product.categoryId, other.id);
  assert.equal((await request(`products/${product.id}`, values, 'PATCH')).status, 409);
  assert.equal((await admin.query('SELECT category_id FROM public.products WHERE id=$1', [oldId])).rows[0].category_id, null);
  assert.equal((await admin.query('SELECT quantity FROM public.stock_movements WHERE product_id=$1', [product.id])).rows[0].quantity, '4');
  await assert.rejects(editor.query('DELETE FROM public.categories'), { code: '42501' });
  await assert.rejects(editor.query('UPDATE public.subcategories SET category_id=$1 WHERE id=$2', [other.id, child.id]), { code: '42501' });
  const list = await fetch(`${base}/api/categories`);
  assert.equal(list.status, 200);
  const data = await list.json();
  require('../api-client').validateCategories(data);
  assert.equal(data.categories.find(row => row.id === root.id).name, 'Repostería propia');
  console.log('OK: rubros propios, renombrado, subcategorías por rubro, vínculos y permisos en PostgreSQL.');
};

module.exports.window = async function checkCategoryWindow(page, admin) {
  await page.locator('#manage-categories').click();
  await page.locator('#category-name').fill('Cotillón pantalla');
  await page.locator('#category-save').click();
  await page.waitForFunction(() => document.querySelector('#category-error').textContent.startsWith('Nombre guardado'));
  const rootId = (await page.locator('#category-edit').inputValue()).split(':')[1];
  await page.locator('#category-edit').selectOption('');
  await page.locator('#category-parent').selectOption(rootId);
  await page.locator('#category-name').fill('Bandejas pantalla');
  await page.locator('#category-save').click();
  await page.waitForFunction(() => document.querySelector('#category-error').textContent.startsWith('Nombre guardado'));
  const childId = (await page.locator('#category-edit').inputValue()).split(':')[1];
  await page.locator('#close-categories').click();
  await page.locator('#product-category').selectOption(rootId);
  await page.locator('#product-subcategory').selectOption(childId);
  await page.locator('#save-product').click();
  await page.waitForFunction(() => document.querySelector('#product-form-status').textContent.includes('Cambios guardados'));
  await page.locator('#refresh-products').click();
  await page.waitForFunction(() => !document.querySelector('#refresh-products').disabled);
  assert.equal(await page.locator('#product-category').inputValue(), rootId);
  assert.equal(await page.locator('#product-subcategory').inputValue(), childId);
  await page.locator('#category-filter').selectOption(rootId);
  await page.locator('#subcategory-filter').selectOption(childId);
  await page.locator('#search-products').click();
  await page.waitForFunction(() => !document.querySelector('#refresh-products').disabled);
  assert.equal(await page.locator('.product-row').count(), 1);
  await page.locator('#product-search').fill('NO COINCIDE 789');
  await page.locator('#product-search').press('Enter');
  await page.waitForFunction(() => !document.querySelector('#refresh-products').disabled);
  assert.equal(await page.locator('.product-row').count(), 0);
  await page.locator('#clear-filters').click();
  await page.waitForFunction(() => !document.querySelector('#refresh-products').disabled);
  assert.ok(await page.locator('.product-row').count() > 1);
  await page.getByRole('button', { name: /Alta desde ventana/ }).click();
  await page.locator('#manage-categories').click();
  await page.locator('#category-edit').selectOption(`categories:${rootId}`);
  assert.equal(await page.locator('#category-parent').isDisabled(), true);
  await page.locator('#category-name').fill('Cotillón local');
  await page.locator('#category-save').click();
  await page.waitForFunction(() => document.querySelector('#category-error').textContent.startsWith('Nombre guardado'));
  await page.locator('#category-edit').selectOption(`subcategories:${childId}`);
  await page.locator('#category-name').fill('Bandejas propias');
  await page.locator('#category-save').click();
  await page.waitForFunction(() => document.querySelector('#category-error').textContent.startsWith('Nombre guardado'));
  await page.locator('#close-categories').click();
  assert.equal(await page.locator('#product-category option:checked').innerText(), 'Cotillón local');
  assert.equal(await page.locator('#product-subcategory option:checked').innerText(), 'Bandejas propias');
  const classified = (await admin.query("SELECT category_id::text, subcategory_id::text, stock FROM public.products WHERE name='Alta desde ventana'")).rows;
  assert.deepEqual(classified, [{ category_id: rootId, subcategory_id: childId, stock: '1.2' }]);
  console.log('OK: ventana crea y renombra rubros/subcategorías, asigna producto, conserva relaciones al reconsultar y filtra por nombre/rubro/subcategoría.');
};
