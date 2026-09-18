const PAGE_SIZE = 100;
const { productFilters } = require('../product-filters');
// to_jsonb permite leer los IDs opcionales sin romper la consulta antes de
// aplicar 005. Solo las operaciones que envían clasificación requieren 005.

async function listProducts(database, afterId = '0', input = {}) {
  const filters = productFilters(input);
  const values = [afterId, PAGE_SIZE + 1];
  const conditions = [];
  if (filters.name) {
    values.push(filters.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
    // strpos busca texto literal: % y _ no se convierten en comodines.
    conditions.push(`strpos(lower(regexp_replace(normalize(name, NFD), '[\u0300-\u036f]', '', 'g')), $${values.length}) > 0`);
  }
  for (const [key, column] of [['categoryId', 'category_id'], ['subcategoryId', 'subcategory_id']]) {
    if (!filters[key]) continue;
    values.push(filters[key]);
    conditions.push(`to_jsonb(products)->>'${column}' = $${values.length}`);
  }
  // $1 y $2 son parámetros: los valores no se concatenan al código SQL.
  const result = await database.query(`
    SELECT id::text AS id, name,
           cost_price AS "costPrice", sale_price AS "salePrice",
           markup_percentage AS "markupPercentage", unit, stock, active,
           created_at AS "createdAt",
           to_jsonb(products)->>'category_id' AS "categoryId",
           to_jsonb(products)->>'subcategory_id' AS "subcategoryId"
    FROM public.products
    WHERE id > $1
    ${conditions.map(condition => `AND ${condition}`).join('\n')}
    -- Ordenar por el BIGINT de la tabla, no por el alias id convertido a texto.
    ORDER BY public.products.id
    LIMIT $2
  `, values);

  const products = result.rows.slice(0, PAGE_SIZE);
  return {
    products,
    nextAfterId: result.rows.length > PAGE_SIZE ? products.at(-1).id : null,
  };
}

// pg conserva BIGINT y NUMERIC como texto para no perder precisión en JavaScript.
// No convertimos dinero ni stock con Number() al preparar la respuesta.
async function updateProduct(database, id, values, expected) {
  const classified = Object.hasOwn(values, 'categoryId');
  // La comparación original evita pisar cambios de otro usuario sin advertirlo.
  // Stock y unidad no aparecen en SET: esta operación no puede modificarlos.
  const result = await database.query(`
    UPDATE public.products
    SET name = $2, cost_price = $3, sale_price = $4, markup_percentage = $5
      ${classified ? ', category_id=$9, subcategory_id=$10' : ''}
    WHERE id = $1 AND name = $6 AND cost_price = $7 AND sale_price = $8
      ${classified ? 'AND category_id IS NOT DISTINCT FROM $11::bigint AND subcategory_id IS NOT DISTINCT FROM $12::bigint' : ''}
    RETURNING id::text AS id, name, cost_price AS "costPrice",
      sale_price AS "salePrice", markup_percentage AS "markupPercentage",
      unit, stock, active, created_at AS "createdAt",
      to_jsonb(products)->>'category_id' AS "categoryId",
      to_jsonb(products)->>'subcategory_id' AS "subcategoryId"
  `, [id, values.name, values.costPrice, values.salePrice, values.markupPercentage,
    expected.name, expected.costPrice, expected.salePrice,
    ...(classified ? [values.categoryId, values.subcategoryId, expected.categoryId, expected.subcategoryId] : [])]);
  return result.rows[0] ?? null;
}

async function createProduct(database, key, values) {
  const classified = Object.hasOwn(values, 'categoryId');
  const payload = JSON.stringify(values);
  const columns = `id::text AS id, name, cost_price AS "costPrice",
    sale_price AS "salePrice", markup_percentage AS "markupPercentage",
    unit, stock, active, created_at AS "createdAt",
    to_jsonb(products)->>'category_id' AS "categoryId",
    to_jsonb(products)->>'subcategory_id' AS "subcategoryId"`;
  // El trigger de 004 guarda el movimiento dentro de este mismo INSERT.
  // La clave permite reintentar una respuesta perdida sin duplicar el alta.
  const inserted = await database.query(`
    INSERT INTO public.products
      (name, cost_price, sale_price, markup_percentage, unit, stock, creation_key, creation_payload
       ${classified ? ', category_id, subcategory_id' : ''})
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb ${classified ? ', $9, $10' : ''})
    ON CONFLICT (creation_key) DO NOTHING
    RETURNING ${columns}
  `, [values.name, values.costPrice, values.salePrice, values.markupPercentage,
    values.unit, values.stock, key, payload, ...(classified ? [values.categoryId, values.subcategoryId] : [])]);
  if (inserted.rows[0]) return { product: inserted.rows[0], created: true };
  // Nueva consulta: también ve el commit de otra petición concurrente.
  const previous = await database.query(`SELECT ${columns} FROM public.products
    WHERE creation_key = $1 AND creation_payload = $2::jsonb`, [key, payload]);
  return previous.rows[0] ? { product: previous.rows[0], created: false } : null;
}

module.exports = { listProducts, updateProduct, createProduct };
