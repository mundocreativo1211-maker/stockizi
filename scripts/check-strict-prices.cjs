// Solo se invoca desde la prueba con PostgreSQL temporal, nunca con .env.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async ({ admin, editor, base }) => {
  const migration = fs.readFileSync(path.join(__dirname, '../database/007_sale_above_cost.sql'), 'utf8');
  const client = await admin.connect();
  try {
    const row = (await client.query("INSERT INTO public.products(name,cost_price,sale_price) VALUES('Igualdad anterior',10,10) RETURNING id::text")).rows[0];
    await assert.rejects(client.query(migration), { code: '23514' });
    await client.query('ROLLBACK');
    assert.deepEqual((await client.query('SELECT cost_price,sale_price,stock FROM public.products WHERE id=$1', [row.id])).rows[0],
      { cost_price: '10.00', sale_price: '10.00', stock: '0' });
    assert.equal((await client.query("SELECT count(*)::int AS n FROM pg_constraint WHERE conrelid='public.products'::regclass AND conname='products_sale_covers_cost'")).rows[0].n, 1);
    const response = await fetch(`${base}/api/products/${row.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Igualdad anterior', costPrice: '10', salePrice: '11',
        expected: { name: 'Igualdad anterior', costPrice: '10.00', salePrice: '10.00' } }) });
    assert.equal(response.status, 200);
    await client.query(migration);
    await assert.rejects(editor.query('UPDATE public.products SET sale_price=cost_price WHERE id=$1', [row.id]), { code: '23514' });
    await assert.rejects(editor.query("INSERT INTO public.products(name,cost_price,sale_price) VALUES('Cero',0,0)"), { code: '23514' });
    assert.equal((await client.query('SELECT sale_price FROM public.products WHERE id=$1', [row.id])).rows[0].sale_price, '11.00');
    console.log('OK: 007 falla con igualdad sin cambiar datos; reparación por API y bloqueo de igualdad en SQL.');
  } finally { await client.query('ROLLBACK'); client.release(); }
};
