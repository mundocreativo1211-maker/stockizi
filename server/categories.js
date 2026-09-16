function validId(value) {
  return typeof value === 'string' && /^[1-9]\d{0,18}$/.test(value) && BigInt(value) <= 9223372036854775807n;
}

function classification(input) {
  if (![input.categoryId, input.subcategoryId].every(value => value === null || validId(value)) ||
      (input.subcategoryId !== null && input.categoryId === null)) {
    throw new Error('Rubro y subcategoría inválidos.');
  }
  return { categoryId: input.categoryId, subcategoryId: input.subcategoryId };
}

async function listCategories(database) {
  // Una sola consulta/snapshot mantiene coherentes padres e hijos.
  const result = await database.query(`SELECT id::text, name, NULL::text AS "categoryId", 'category' AS kind
    FROM public.categories UNION ALL
    SELECT id::text, name, category_id::text AS "categoryId", 'subcategory' AS kind
    FROM public.subcategories`);
  const byName = (a, b) => a.name.localeCompare(b.name, 'es');
  return { categories: result.rows.filter(row => row.kind === 'category').sort(byName),
    subcategories: result.rows.filter(row => row.kind === 'subcategory').sort(byName) };
}

async function saveCategory(database, kind, id, input) {
  // Tabla elegida exclusivamente de esta lista interna, nunca de texto del usuario.
  const child = kind === 'subcategories';
  const table = child ? 'public.subcategories' : 'public.categories';
  const columns = child ? 'id::text, name, category_id::text AS "categoryId"' : 'id::text, name';
  if (id) {
    const result = await database.query(`UPDATE ${table} SET name=$2
      WHERE id=$1 AND name=$3 RETURNING ${columns}`, [id, input.name, input.expectedName]);
    return result.rows[0] ? { item: result.rows[0], created: false } : null;
  }
  const params = child ? [input.name, input.categoryId] : [input.name];
  const result = await database.query(`INSERT INTO ${table} (${child ? 'name, category_id' : 'name'})
    VALUES (${child ? '$1, $2' : '$1'}) ON CONFLICT DO NOTHING RETURNING ${columns}`, params);
  if (result.rows[0]) return { item: result.rows[0], created: true };
  // Repetir un alta con el mismo nombre no crea otro rubro.
  const previous = await database.query(`SELECT ${columns} FROM ${table}
    WHERE lower(name)=lower($1 COLLATE pg_catalog.pg_unicode_fast) ${child ? 'AND category_id=$2' : ''}`, params);
  return previous.rows[0] ? { item: previous.rows[0], created: false } : null;
}

module.exports = { validId, classification, listCategories, saveCategory };
