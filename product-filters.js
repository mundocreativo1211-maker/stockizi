// Contrato compartido por la API y el cliente de Electron; nunca acepta SQL.
function productFilters(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).some(key => !['name', 'categoryId', 'subcategoryId'].includes(key))) throw new Error('Filtros inválidos.');
  const name = input.name ?? '';
  if (typeof name !== 'string' || name.length > 200 || /[\u0000-\u001f\u007f-\u009f]/.test(name)) throw new Error('Nombre de búsqueda inválido.');
  const ids = ['categoryId', 'subcategoryId'].map(key => {
    const value = input[key] ?? '';
    if (value !== '' && (typeof value !== 'string' || !/^[1-9]\d{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n)) throw new Error('Rubro inválido.');
    return value;
  });
  if (ids[1] && !ids[0]) throw new Error('La subcategoría requiere un rubro.');
  return { name: name.trim(), categoryId: ids[0], subcategoryId: ids[1] };
}
module.exports = { productFilters };
