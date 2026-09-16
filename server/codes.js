function cleanCode(value) {
  if (typeof value !== 'string') throw new Error('El código debe ser texto.');
  const code = value.trim();
  if (!code || code.length > 100 || /[\u0000-\u001f\u007f-\u009f]/.test(value)) {
    throw new Error('Usá un código de 1 a 100 caracteres, sin saltos de línea.');
  }
  return code;
}

async function listCodes(database, productId) {
  return (await database.query(`SELECT id::text, product_id::text AS "productId", code
    FROM public.product_codes WHERE product_id=$1 AND active ORDER BY product_codes.id`, [productId])).rows;
}

async function addCode(database, productId, code) {
  const inserted = await database.query(`INSERT INTO public.product_codes (product_id, code)
    VALUES ($1, $2) ON CONFLICT (code) WHERE active DO NOTHING
    RETURNING id::text, product_id::text AS "productId", code`, [productId, code]);
  if (inserted.rows[0]) return { item: inserted.rows[0], created: true };
  // Reintentar el mismo código/producto no duplica. Nunca reasignar otro producto.
  const previous = await database.query(`SELECT id::text, product_id::text AS "productId", code
    FROM public.product_codes WHERE product_id=$1 AND code=$2 AND active`, [productId, code]);
  return previous.rows[0] ? { item: previous.rows[0], created: false } : null;
}

async function removeCode(database, productId, id) {
  // Se usa el ID de la asociación, no el texto: un reintento no quita una nueva asociación.
  const result = await database.query(`UPDATE public.product_codes SET active=false
    WHERE product_id=$1 AND id=$2 RETURNING id::text`, [productId, id]);
  return result.rows.length > 0;
}

async function findByCode(database, code) {
  const result = await database.query(`SELECT p.id::text, p.name,
    p.cost_price AS "costPrice", p.sale_price AS "salePrice",
    p.markup_percentage AS "markupPercentage", p.unit, p.stock, p.active,
    p.created_at AS "createdAt", p.category_id::text AS "categoryId",
    p.subcategory_id::text AS "subcategoryId"
    FROM public.products p JOIN public.product_codes c ON c.product_id=p.id
    WHERE c.code=$1 AND c.active`, [code]);
  return result.rows[0] ?? null;
}

module.exports = { cleanCode, listCodes, addCode, removeCode, findByCode };
