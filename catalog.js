// Vista conectada. Solo actualizamos el catálogo después de confirmar el guardado.
const catalog = [];
let selectedId = null;
let nextAfterId = null;
let loading = false;
let hasLoaded = false;
let saving = false;
let newRequestId = null;
let markupError = '';
const newButton = document.querySelector('#new-product');
const editable = ['#product-name', '#product-cost-price', '#product-sale-price'];
const saveButton = document.querySelector('#save-product');
const cancelButton = document.querySelector('#cancel-product');
const formError = document.querySelector('#form-error');

function draft() {
  const [name, costPrice, salePrice] = editable.map(selector => document.querySelector(selector).value);
  return { name, costPrice, salePrice, ...window.stockiziCategories?.selection() };
}

function dirty() {
  if (markupError) return true;
  if (newRequestId) return true;
  const product = catalog.find(item => item.id === selectedId);
  if (!product) return false;
  const values = draft();
  return Object.keys(values).some(key => values[key] !== (product[key] ?? null));
}

function updateControls() {
  let valid = false;
  try { validatedDraft(); valid = true; } catch {}
  for (const selector of editable) document.querySelector(selector).disabled = (!selectedId && !newRequestId) || saving || loading;
  let positiveCost = false;
  try { positiveCost = stockiziPricing.cents(draft().costPrice) > 0n; } catch {}
  document.querySelector('#product-markup').disabled = (!selectedId && !newRequestId) || !positiveCost || saving || loading;
  for (const selector of ['#product-stock', '#product-unit']) {
    document.querySelector(selector).disabled = !newRequestId || saving || loading;
  }
  document.querySelector('#product-stock').step = document.querySelector('#product-unit').value === 'UNIT' ? '1' : '0.001';
  newButton.disabled = !hasLoaded || saving || loading;
  window.stockiziCodes?.setEnabled(!!selectedId && !newRequestId, saving || loading);
  window.stockiziCategories?.setEnabled(!!(selectedId || newRequestId) && !saving && !loading);
  saveButton.disabled = !dirty() || !valid || saving || loading;
  cancelButton.disabled = !dirty() || saving || loading;
}

function validatedDraft() {
  if (markupError) throw new Error(markupError);
  const values = newRequestId ? stockiziPricing.validateInitial({ ...draft(),
    unit: document.querySelector('#product-unit').value,
    stock: document.querySelector('#product-stock').value }) : stockiziPricing.validate(draft());
  return { ...values, ...window.stockiziCategories?.selection() };
}

function canLeave() {
  if (saving || loading) return false;
  if (!dirty()) return true;
  formError.textContent = 'Hay cambios sin guardar. Guardá o apretá Cancelar antes de cambiar de producto o actualizar.';
  return false;
}
const list = document.querySelector('#products-list');
const search = document.querySelector('#product-search');
const summary = document.querySelector('#results-summary');
const connectionStatus = document.querySelector('#connection-status');
const refreshButton = document.querySelector('#refresh-products');
const moreButton = document.querySelector('#load-more-products');
const form = document.querySelector('#product-form');
const title = document.querySelector('#product-form-title');
const detailStatus = document.querySelector('#product-form-status');
const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
const quantity = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 });
const units = { UNIT: 'un.', KILOGRAM: 'kg', METER: 'm', LITER: 'l' };

function normalizeName(value) {
  return value.trim().toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function showDetail() {
  markupError = '';
  const product = catalog.find(item => item.id === selectedId);
  form.reset();
  window.stockiziCategories?.fillDetail(product);
  if (newRequestId) {
    title.textContent = 'Nuevo producto';
    detailStatus.textContent = 'Ingresá lo que ya tenés. Al guardar se registra automáticamente Stock inicial, incluso si es cero.';
    document.querySelector('#product-stock').value = '0';
    document.querySelector('#product-unit').value = 'UNIT';
    formError.textContent = '';
    updateControls();
    return;
  }
  title.textContent = product ? `Editar #${product.id}: ${product.name}` : 'Seleccioná un producto';
  detailStatus.textContent = product ? (product.active ? 'Producto activo.' : 'Producto inactivo.') : 'Seleccioná un producto para editar nombre, costo y venta.';
  formError.textContent = '';
  if (!product) { updateControls(); return; }
  const values = {
    '#product-name': product.name, '#product-cost-price': product.costPrice,
    '#product-sale-price': product.salePrice, '#product-markup': product.markupPercentage ?? '',
    '#product-stock': product.stock, '#product-unit': product.unit,
  };
  for (const [selector, value] of Object.entries(values)) {
    document.querySelector(selector).value = value;
  }
  // Mostramos lo guardado, incluso un porcentaje desactualizado: no lo corregimos al leer.
  updateControls();
}

function renderCatalog() {
  list.innerHTML = '';
  const visible = catalog.filter(product => normalizeName(product.name).includes(normalizeName(search.value)) &&
    (window.stockiziCategories?.matches(product) ?? true));
  summary.textContent = !hasLoaded ? 'Todavía no hay datos cargados.'
    : catalog.length === 0 ? 'La base no tiene productos.'
      : `Mostrando ${visible.length} de ${catalog.length} productos cargados.${nextAfterId ? ' La búsqueda abarca solo los cargados; hay más páginas.' : ''}`;
  for (const product of visible) {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'product-row';
    button.setAttribute('aria-pressed', String(product.id === selectedId));
    button.textContent = `#${product.id} · ${product.name} · ${currency.format(product.salePrice)} · Stock: ${quantity.format(product.stock)} ${units[product.unit]}${product.active ? '' : ' · Inactivo'}`;
    button.addEventListener('click', () => {
      if (!canLeave()) return;
      selectedId = product.id;
      showDetail();
      // No recrear las filas al seleccionar: conserva el foco de teclado.
      for (const entry of list.querySelectorAll('button')) entry.setAttribute('aria-pressed', String(entry === button));
    });
    row.append(button);
    list.append(row);
  }
  moreButton.hidden = nextAfterId === null;
}

async function loadCatalog(append = false) {
  if (!canLeave() || (append && nextAfterId === null)) return;
  loading = true;
  updateControls();
  refreshButton.disabled = true;
  moreButton.disabled = true;
  list.setAttribute('aria-busy', 'true');
  connectionStatus.textContent = append ? 'Cargando más productos…' : 'Consultando PostgreSQL…';
  connectionStatus.className = '';
  try {
    if (!window.stockizi?.listProducts) throw new Error('Puente no disponible');
    const result = await window.stockizi.listProducts(append ? nextAfterId : '0');
    if (!result.ok) throw new Error('No se pudo consultar');
    await window.stockiziCategories?.refresh();
    if (!append) catalog.length = 0;
    for (const product of result.products) {
      const index = catalog.findIndex(item => item.id === product.id);
      if (index === -1) catalog.push(product);
      else catalog[index] = product;
    }
    nextAfterId = result.nextAfterId;
    hasLoaded = true;
    if (!catalog.some(product => product.id === selectedId)) selectedId = null;
    showDetail();
    renderCatalog();
    connectionStatus.textContent = 'Datos consultados en PostgreSQL. Actualizar vuelve a consultar.';
  } catch {
    connectionStatus.className = 'connection-error';
    connectionStatus.textContent = 'No se pudo consultar la API. Dejá npm run api abierto y apretá Actualizar.' +
      (hasLoaded ? ' Los datos visibles son de la última consulta y pueden estar desactualizados.' : ' No se cargaron productos de ejemplo.');
  } finally {
    loading = false;
    updateControls();
    refreshButton.disabled = false;
    moreButton.disabled = false;
    list.setAttribute('aria-busy', 'false');
  }
}

form.addEventListener('input', event => {
  formError.textContent = '';
  const target = event?.target;
  let keepPercentage = target === document.querySelector('#product-markup');
  if (target === document.querySelector('#product-markup')) {
    markupError = '';
    try {
      document.querySelector('#product-sale-price').value = stockiziPricing.saleFromMarkup(draft().costPrice, target.value);
    } catch (error) { markupError = error.message; }
  } else if (target === document.querySelector('#product-cost-price')) {
    markupError = '';
    const percentage = document.querySelector('#product-markup').value;
    if (percentage !== '') {
      keepPercentage = true;
      try {
        if (stockiziPricing.cents(draft().costPrice) === 0n) {
          keepPercentage = false;
        } else {
          document.querySelector('#product-sale-price').value = stockiziPricing.saleFromMarkup(draft().costPrice, percentage);
        }
      } catch (error) { markupError = error.message; }
    }
  } else if (!target || target === document.querySelector('#product-sale-price')) {
    markupError = '';
  }
  try {
    const values = validatedDraft();
    // No reescribir el porcentaje mientras se tipea: la venta redondea a centavos.
    if (!keepPercentage) {
      document.querySelector('#product-markup').value = values.markupPercentage ?? '';
    }
  } catch (error) {
    if (!markupError && !keepPercentage) document.querySelector('#product-markup').value = '';
    formError.textContent = error.message;
  }
  updateControls();
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (saving || loading || (!selectedId && !newRequestId) || !dirty()) return;
  let values;
  try { values = validatedDraft(); }
  catch (error) { formError.textContent = error.message; return; }
  const original = catalog.find(product => product.id === selectedId);
  const creating = !!newRequestId;
  const classification = Object.hasOwn(values, 'categoryId') ? { categoryId: values.categoryId, subcategoryId: values.subcategoryId } : {};
  const changes = creating ? { name: values.name, costPrice: values.costPrice, salePrice: values.salePrice,
    unit: values.unit, stock: values.stock, requestId: newRequestId, ...classification }
    : { name: values.name, costPrice: values.costPrice, salePrice: values.salePrice,
    ...classification,
    expected: { name: original.name, costPrice: original.costPrice, salePrice: original.salePrice,
      ...(Object.hasOwn(values, 'categoryId') ? { categoryId: original.categoryId ?? null, subcategoryId: original.subcategoryId ?? null } : {}) } };
  saving = true;
  formError.textContent = '';
  detailStatus.textContent = 'Guardando en PostgreSQL…';
  updateControls();
  try {
    const result = creating ? await window.stockizi.createProduct(changes)
      : await window.stockizi.saveProduct(selectedId, changes);
    if (!result.ok) throw new Error(result.error);
    const index = catalog.findIndex(product => product.id === result.product.id);
    if (index === -1) catalog.push(result.product);
    else catalog[index] = result.product;
    selectedId = result.product.id;
    newRequestId = null;
    if (creating) { search.value = ''; window.stockiziCategories?.clearFilters(); }
    showDetail();
    renderCatalog();
    detailStatus.textContent = creating ? 'Producto guardado. Su movimiento Stock inicial quedó registrado.' : 'Cambios guardados en PostgreSQL.';
  } catch (error) {
    formError.textContent = error.message || 'No se pudo confirmar el guardado. Consultá antes de reintentar.';
    detailStatus.textContent = 'Tu formulario se conserva; no se confirmó el guardado.';
  } finally { saving = false; updateControls(); }
});
cancelButton.addEventListener('click', () => {
  if (!saving && !loading) { newRequestId = null; showDetail(); renderCatalog(); }
});
newButton.addEventListener('click', () => {
  if (!hasLoaded || !canLeave()) return;
  newRequestId = crypto.randomUUID();
  selectedId = null;
  showDetail();
  renderCatalog();
});
search.addEventListener('input', renderCatalog);
document.querySelector('#clear-filters').addEventListener('click', () => { search.value = ''; window.stockiziCategories?.clearFilters(); renderCatalog(); });
refreshButton.addEventListener('click', () => loadCatalog());
moreButton.addEventListener('click', () => loadCatalog(true));
window.stockiziExit?.register(() => ({ dirty: dirty(), busy: saving }));
window.stockiziCategories?.init(updateControls, renderCatalog, canLeave);
window.stockiziCodes?.init({
  canLeave,
  getProduct: () => catalog.find(product => product.id === selectedId),
  setBusy(value) {
    loading = value;
    refreshButton.disabled = value;
    moreButton.disabled = value;
    updateControls();
  },
  found(product) {
    const index = catalog.findIndex(item => item.id === product.id);
    if (index === -1) catalog.push(product);
    else catalog[index] = product;
    hasLoaded = true;
    selectedId = product.id;
    search.value = '';
    window.stockiziCategories?.clearFilters();
    showDetail(); renderCatalog();
    const selectedRow = list.querySelector('[aria-pressed="true"]');
    if (selectedRow) list.parentElement.scrollTop = selectedRow.offsetTop - list.parentElement.offsetTop;
  },
});
showDetail();
renderCatalog();
loadCatalog();
