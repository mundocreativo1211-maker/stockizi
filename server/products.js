const PAGE_SIZE = 100;

async function listProducts(database, afterId = '0') {
  // $1 y $2 son parámetros: los valores no se concatenan al código SQL.
  const result = await database.query(`
    SELECT id::text AS id, name,
           cost_price AS "costPrice", sale_price AS "salePrice",
           markup_percentage AS "markupPercentage", unit, stock, active,
           created_at AS "createdAt"
    FROM public.products
    WHERE id > $1
    ORDER BY id
    LIMIT $2
  `, [afterId, PAGE_SIZE + 1]);

  const products = result.rows.slice(0, PAGE_SIZE);
  return {
    products,
    nextAfterId: result.rows.length > PAGE_SIZE ? products.at(-1).id : null,
  };
}

// pg conserva BIGINT y NUMERIC como texto para no perder precisión en JavaScript.
// No convertimos dinero ni stock con Number() al preparar la respuesta.
async function updateProduct(database, id, values, expected) {
  // La comparación original evita pisar cambios de otro usuario sin advertirlo.
  // Stock y unidad no aparecen en SET: esta operación no puede modificarlos.
  const result = await database.query(`
    UPDATE public.products
    SET name = $2, cost_price = $3, sale_price = $4, markup_percentage = $5
    WHERE id = $1 AND name = $6 AND cost_price = $7 AND sale_price = $8
    RETURNING id::text AS id, name, cost_price AS "costPrice",
      sale_price AS "salePrice", markup_percentage AS "markupPercentage",
      unit, stock, active, created_at AS "createdAt"
  `, [id, values.name, values.costPrice, values.salePrice, values.markupPercentage,
    expected.name, expected.costPrice, expected.salePrice]);
  return result.rows[0] ?? null;
}

module.exports = { listProducts, updateProduct };
