// Rubros propios persistentes. Los nombres son editables; los vínculos usan IDs.
(function () {
  let categories = [], subcategories = [], ready = false, busy = false;
  let onChange = () => {}, render = () => {}, canLeave = () => true;
  const field = id => document.querySelector(`#${id}`);
  function options(select, rows, empty, selected = select.value) {
    select.innerHTML = '';
    for (const row of [{ id: '', name: empty }, ...rows]) {
      const option = document.createElement('option');
      option.value = row.id;
      option.textContent = row.name;
      select.append(option);
    }
    select.value = rows.some(row => row.id === selected) ? selected : '';
  }
  function children(id) { return subcategories.filter(row => row.categoryId === id); }
  function paint() {
    categories.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    subcategories.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    options(field('product-category'), categories, 'Sin rubro');
    options(field('product-subcategory'), children(field('product-category').value), 'Sin subcategoría');
    options(field('category-filter'), categories, 'Todos los rubros');
    options(field('subcategory-filter'), children(field('category-filter').value), 'Todas las subcategorías');
    field('category-filter').disabled = !ready;
    field('subcategory-filter').disabled = !ready || !field('category-filter').value;
  }
  async function refresh() {
    if (!window.stockizi?.listCategories) return;
    try {
      const result = await window.stockizi.listCategories();
      if (!result.ok) throw new Error(result.error);
      categories = result.categories; subcategories = result.subcategories; ready = true;
      paint();
      field('categories-status').textContent = '';
      field('categories-status').hidden = true;
    } catch (error) {
      ready = false;
      field('category-filter').disabled = true;
      field('subcategory-filter').disabled = true;
      field('categories-status').textContent = error.message || 'No se pudieron consultar los rubros.';
      field('categories-status').hidden = false;
    }
    onChange();
  }
  function fillDetail(product) {
    if (!ready) return;
    options(field('product-category'), categories, 'Sin rubro', product?.categoryId || '');
    options(field('product-subcategory'), children(field('product-category').value), 'Sin subcategoría', product?.subcategoryId || '');
  }
  function selection() {
    return ready ? { categoryId: field('product-category').value || null, subcategoryId: field('product-subcategory').value || null } : {};
  }
  function matches(product) {
    return !ready || ((!field('category-filter').value || product.categoryId === field('category-filter').value) &&
      (!field('subcategory-filter').value || product.subcategoryId === field('subcategory-filter').value));
  }
  function setEnabled(enabled) {
    field('product-category').disabled = !ready || !enabled;
    field('product-subcategory').disabled = !ready || !enabled || !field('product-category').value;
  }
  function selectedItem() {
    const [kind, id] = field('category-edit').value.split(':');
    return { kind, id, item: (kind === 'subcategories' ? subcategories : categories).find(row => row.id === id) };
  }
  function editorFields() {
    const { item } = selectedItem();
    options(field('category-parent'), categories, 'Rubro principal', item?.categoryId || '');
    field('category-parent').disabled = !!item || busy;
    field('category-name').value = item?.name || '';
    field('category-error').textContent = '';
  }
  function editorOptions(selected = '') {
    options(field('category-edit'), [
      ...categories.map(row => ({ id: `categories:${row.id}`, name: `Rubro: ${row.name}` })),
      ...subcategories.map(row => ({ id: `subcategories:${row.id}`, name: `${categories.find(parent => parent.id === row.categoryId)?.name} → ${row.name}` })),
    ], 'Crear nuevo', selected);
    editorFields();
  }
  function managerBusy(value) {
    busy = value;
    for (const id of ['category-edit', 'category-name', 'category-save', 'close-categories']) field(id).disabled = busy;
    field('category-parent').disabled = busy || !!selectedItem().item;
  }
  function init(changed, renderCatalog, mayLeave) {
    onChange = changed; render = renderCatalog; canLeave = mayLeave;
    field('manage-categories').disabled = false;
    field('product-category').addEventListener('change', () => {
      options(field('product-subcategory'), children(field('product-category').value), 'Sin subcategoría', ''); onChange();
    });
    field('product-subcategory').addEventListener('change', onChange);
    field('category-filter').addEventListener('change', () => {
      options(field('subcategory-filter'), children(field('category-filter').value), 'Todas las subcategorías', '');
      field('subcategory-filter').disabled = !field('category-filter').value; render();
    });
    field('subcategory-filter').addEventListener('change', render);
    field('manage-categories').addEventListener('click', async () => {
      if (busy || !canLeave()) return;
      field('manage-categories').disabled = true;
      try {
        await refresh();
        if (!ready) return;
        editorOptions();
        field('category-dialog').showModal();
      } finally { field('manage-categories').disabled = false; }
    });
    field('category-edit').addEventListener('change', editorFields);
    field('close-categories').addEventListener('click', () => { if (!busy) field('category-dialog').close(); });
    field('category-dialog').addEventListener('cancel', event => { if (busy) event.preventDefault(); });
    field('category-form').addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      const name = field('category-name').value.trim();
      if (!name || name.length > 80) { field('category-error').textContent = 'Escribí un nombre de hasta 80 caracteres.'; return; }
      const selected = selectedItem();
      const parent = field('category-parent').value;
      const kind = selected.item ? selected.kind : parent ? 'subcategories' : 'categories';
      const input = selected.item ? { name, expectedName: selected.item.name } : parent ? { name, categoryId: parent } : { name };
      managerBusy(true);
      field('category-error').textContent = 'Guardando…';
      try {
        const result = await window.stockizi.saveCategory(kind, selected.item ? selected.id : null, input);
        if (!result.ok) throw new Error(result.error);
        const rows = kind === 'categories' ? categories : subcategories;
        const index = rows.findIndex(row => row.id === result.item.id);
        if (index === -1) rows.push(result.item); else rows[index] = result.item;
        paint(); editorOptions(`${kind}:${result.item.id}`); onChange(); render();
        field('category-error').textContent = 'Nombre guardado. Los productos conservan su vínculo.';
      } catch (error) { field('category-error').textContent = error.message || 'No se pudo confirmar el guardado.'; }
      finally { managerBusy(false); }
    });
  }
  function clearFilters() {
    field('category-filter').value = '';
    options(field('subcategory-filter'), [], 'Todas las subcategorías');
    field('subcategory-filter').disabled = true;
  }
  window.stockiziExit?.register(() => ({
    busy,
    dirty: field('category-dialog').open &&
      field('category-name').value !== (selectedItem().item?.name || ''),
  }));
  window.stockiziCategories = { init, refresh, fillDetail, selection, matches, setEnabled, clearFilters };
})();
