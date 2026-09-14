const categories = [];
let nextCategoryId = 1;

const products = [
  {
    id: 'product-1',
    name: 'Martillo',
    costPrice: 6800,
    markupPercentage: 25,
    salePrice: 8500,
    stock: 10,
    unit: 'UNIT',
  },
  {
    id: 'product-2',
    name: 'Destornillador',
    costPrice: 3000,
    markupPercentage: 40,
    salePrice: 4200,
    stock: 6,
    unit: 'UNIT',
  },
];
let nextProductId = 3;
let selectedProductId = null;
let savedFormSnapshot = '';
let pendingFormAction = null;

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
});
const quantityFormatter = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 3,
});

const unitLabels = {
  UNIT: 'un.',
  KILOGRAM: 'kg',
  METER: 'm',
  LITER: 'l',
};

const productsList = document.querySelector('#products-list');
const productForm = document.querySelector('#product-form');
const productName = document.querySelector('#product-name');
const productCostPrice = document.querySelector('#product-cost-price');
const productMarkup = document.querySelector('#product-markup');
const productSalePrice = document.querySelector('#product-sale-price');
const productStock = document.querySelector('#product-stock');
const productUnit = document.querySelector('#product-unit');
const formError = document.querySelector('#form-error');
const productCategory = document.querySelector('#product-category');
const categoryFilter = document.querySelector('#category-filter');
const productSearch = document.querySelector('#product-search');
const resultsSummary = document.querySelector('#results-summary');
const clearFilters = document.querySelector('#clear-filters');
const productSubcategory = document.querySelector('#product-subcategory');
const subcategoryFilter = document.querySelector('#subcategory-filter');
const categoryDialog = document.querySelector('#category-dialog');
const categoryEdit = document.querySelector('#category-edit');
const categoryParent = document.querySelector('#category-parent');
const categoryName = document.querySelector('#category-name');
const categoryError = document.querySelector('#category-error');
const saveProductButton = document.querySelector('#save-product');
const cancelProductButton = document.querySelector('#cancel-product');
const productFormTitle = document.querySelector('#product-form-title');
const productFormStatus = document.querySelector('#product-form-status');
const discardDialog = document.querySelector('#discard-dialog');
const draftFields = [productName, productCostPrice, productMarkup, productSalePrice,
  productStock, productUnit, productCategory, productSubcategory];

function readProductDraft() {
  return {
    name: productName.value.trim(),
    costPrice: productCostPrice.valueAsNumber,
    markupPercentage: productMarkup.valueAsNumber,
    salePrice: productSalePrice.valueAsNumber,
    stock: productStock.valueAsNumber,
    unit: productUnit.value,
    categoryId: productCategory.value || null,
    subcategoryId: productSubcategory.value || null,
  };
}

// Comparamos los campos, incluso si están incompletos. El catálogo no es el borrador.
function formSnapshot() {
  return JSON.stringify(draftFields.map(field => field.value));
}

function hasProductChanges() {
  return formSnapshot() !== savedFormSnapshot;
}

function updateProductFormState() {
  const changed = hasProductChanges();
  const error = validateProduct(readProductDraft());
  const validFields = draftFields.every(field => field.validity.valid);
  saveProductButton.disabled = !changed || Boolean(error) || !validFields;
  cancelProductButton.disabled = !changed;
  formError.textContent = changed ? error : '';
  productFormStatus.textContent = changed
    ? 'Cambios sin guardar.'
    : selectedProductId ? 'Sin cambios pendientes.' : 'Completá los datos para crear un producto.';
}

function loadProductForm(id = null) {
  const product = products.find(item => item.id === id);
  if (id !== null && !product) return;
  selectedProductId = id;
  productForm.reset();
  productCategory.value = product?.categoryId || '';
  updateSubcategories();
  productSubcategory.value = product?.subcategoryId || '';
  if (product) {
    productName.value = product.name;
    productCostPrice.value = String(product.costPrice);
    productMarkup.value = String(product.markupPercentage);
    productSalePrice.value = String(product.salePrice);
    productStock.value = String(product.stock);
    productUnit.value = product.unit;
  }
  // Cargar valores no recalcula el precio manual del producto.
  updateStockRules();
  productFormTitle.textContent = product ? `Editar: ${product.name}` : 'Nuevo producto';
  savedFormSnapshot = formSnapshot();
  updateProductFormState();
  showProducts();
}

function requestFormAction(action) {
  if (!hasProductChanges()) {
    action();
    return;
  }
  pendingFormAction = action;
  discardDialog.showModal();
}

function selectProduct(id) {
  if (id === selectedProductId) return;
  requestFormAction(() => {
    loadProductForm(id);
    productName.focus();
  });
}

function fillSelect(select, items, emptyLabel, includeUncategorized = false) {
  const previousValue = select.value;
  select.innerHTML = '';
  const choices = [{ id: '', name: emptyLabel }, ...items];
  if (includeUncategorized) choices.splice(1, 0, { id: 'uncategorized', name: 'Sin rubro' });
  for (const item of choices) {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.name;
    select.append(option);
  }
  select.value = choices.some(item => item.id === previousValue) ? previousValue : '';
}

function updateSubcategories() {
  fillSelect(productSubcategory, categories.filter(c => c.parentId && c.parentId === productCategory.value), 'Sin subcategoría');
  productSubcategory.disabled = !productCategory.value;
}

function updateSubcategoryFilter() {
  fillSelect(subcategoryFilter, categories.filter(c => c.parentId && c.parentId === categoryFilter.value), 'Todas');
  subcategoryFilter.disabled = !categoryFilter.value || categoryFilter.value === 'uncategorized';
}

function populateCategories() {
  const roots = categories.filter(c => !c.parentId);
  fillSelect(productCategory, roots, 'Sin rubro');
  fillSelect(categoryFilter, roots, 'Todos los rubros', true);
  fillSelect(categoryParent, roots, 'Ninguno: crear un rubro');
  fillSelect(categoryEdit, categories.map(c => ({ id: c.id, name: c.parentId ? `${categories.find(p => p.id === c.parentId).name} / ${c.name}` : c.name })), 'Crear nuevo');
  updateSubcategories();
  updateSubcategoryFilter();
}

function saveCategory(id, name, parentId) {
  name = name.trim();
  const existing = categories.find(c => c.id === id);
  if (id && !existing) return 'La categoría no existe.';
  if (existing) parentId = existing.parentId;
  if (!name) return 'Escribí un nombre.';
  if (name.length > 80) return 'Usá hasta 80 caracteres.';
  if (parentId && !categories.some(c => c.id === parentId && !c.parentId)) return 'Elegí un rubro válido.';
  if (categories.some(c => c.id !== id && c.parentId === parentId && normalizeSearch(c.name) === normalizeSearch(name))) return 'Ese nombre ya existe en este nivel.';
  if (existing) existing.name = name;
  else categories.push({ id: `category-${nextCategoryId++}`, name, parentId });
  return '';
}

function normalizeSearch(text) {
  return text.trim().toLocaleLowerCase('es-AR')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function filterProducts(items, search, categoryId, subcategoryId = '') {
  const query = normalizeSearch(search);
  return items.filter(product => {
    const matchesName = normalizeSearch(product.name).includes(query);
    const matchesCategory = categoryId === '' ||
      (categoryId === 'uncategorized' ? !product.categoryId : product.categoryId === categoryId);
    return matchesName && matchesCategory && (!subcategoryId || product.subcategoryId === subcategoryId);
  });
}

function validateProduct(product) {
  if (product.name === '') {
    return 'El producto debe tener un nombre.';
  }

  if (product.categoryId && !categories.some(category => category.id === product.categoryId && !category.parentId)) {
    return 'Seleccioná un rubro válido.';
  }

  if (product.subcategoryId && !categories.some(c => c.id === product.subcategoryId && c.parentId && c.parentId === product.categoryId)) {
    return 'La subcategoría debe pertenecer al rubro seleccionado.';
  }

  if (!Number.isFinite(product.costPrice) || product.costPrice < 0) {
    return 'El costo debe ser un número igual o mayor que cero.';
  }

  if (!Number.isFinite(product.markupPercentage) || product.markupPercentage < 0) {
    return 'El porcentaje debe ser un número igual o mayor que cero.';
  }

  if (!Number.isFinite(product.salePrice) || product.salePrice < 0) {
    return 'El precio de venta debe ser un número igual o mayor que cero.';
  }

  if (!Object.hasOwn(unitLabels, product.unit)) {
    return 'Seleccioná una unidad de medida válida.';
  }

  if (!Number.isFinite(product.stock) || product.stock < 0) {
    return 'El stock inicial debe ser un número igual o mayor que cero.';
  }

  if (product.unit === 'UNIT' && !Number.isInteger(product.stock)) {
    return 'El stock por unidad debe ser un número entero.';
  }

  return '';
}

function calculateSalePrice(costPrice, markupPercentage) {
  return costPrice * (1 + markupPercentage / 100);
}

function updateMarkupFromSalePrice() {
  const costPrice = productCostPrice.valueAsNumber;
  const salePrice = productSalePrice.valueAsNumber;

  if (
    !Number.isFinite(costPrice) || costPrice <= 0 ||
    !Number.isFinite(salePrice) || salePrice < 0
  ) {
    productMarkup.value = '';
    return;
  }

  const markupPercentage = ((salePrice - costPrice) / costPrice) * 100;
  productMarkup.value = markupPercentage.toFixed(2);
}

function updateSuggestedSalePrice() {
  if (productCostPrice.value === '' || productMarkup.value === '') {
    productSalePrice.value = '';
    return;
  }

  const costPrice = productCostPrice.valueAsNumber;
  const markupPercentage = productMarkup.valueAsNumber;
  if (
    !Number.isFinite(costPrice) || costPrice < 0 ||
    !Number.isFinite(markupPercentage) || markupPercentage < 0
  ) {
    productSalePrice.value = '';
    return;
  }
  const suggestedPrice = calculateSalePrice(costPrice, markupPercentage);

  productSalePrice.value = suggestedPrice.toFixed(2);
}

function showProducts() {
  productsList.innerHTML = '';
  const visibleProducts = filterProducts(products, productSearch.value, categoryFilter.value, subcategoryFilter.value);
  resultsSummary.textContent = visibleProducts.length === 0
    ? 'No hay productos que coincidan con la búsqueda.'
    : `Mostrando ${visibleProducts.length} de ${products.length} productos.`;

  for (const product of visibleProducts) {
    const listItem = document.createElement('li');
    const categoryName = categories.find(category => category.id === product.categoryId)?.name || 'Sin rubro';
    const subcategoryName = categories.find(category => category.id === product.subcategoryId)?.name;

    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = 'product-row';
    selectButton.setAttribute('aria-pressed', String(product.id === selectedProductId));
    selectButton.textContent =
      `${product.name} - ${currencyFormatter.format(product.salePrice)} - ` +
      `Stock: ${quantityFormatter.format(product.stock)} ${unitLabels[product.unit]} · ${categoryName}${subcategoryName ? ` / ${subcategoryName}` : ''}`;

    selectButton.addEventListener('click', () => selectProduct(product.id));
    listItem.append(selectButton);
    productsList.append(listItem);
  }
}

function updateStockRules() {
  if (productUnit.value === 'UNIT') {
    productStock.step = '1';
    productStock.placeholder = 'Ejemplo: 12';
  } else {
    productStock.step = '0.001';
    productStock.placeholder = 'Ejemplo: 1.200';
  }
}

productCostPrice.addEventListener('input', updateSuggestedSalePrice);
productMarkup.addEventListener('input', updateSuggestedSalePrice);
productSalePrice.addEventListener('input', updateMarkupFromSalePrice);
productUnit.addEventListener('change', updateStockRules);
productSearch.addEventListener('input', showProducts);
productCategory.addEventListener('change', () => { productSubcategory.value = ''; updateSubcategories(); });
categoryFilter.addEventListener('change', () => { subcategoryFilter.value = ''; updateSubcategoryFilter(); showProducts(); });
subcategoryFilter.addEventListener('change', showProducts);
document.querySelector('#manage-categories').addEventListener('click', () => {
  categoryEdit.value = '';
  categoryParent.value = '';
  categoryParent.disabled = false;
  categoryName.value = '';
  categoryError.textContent = '';
  populateCategories();
  categoryDialog.showModal();
});
document.querySelector('#close-categories').addEventListener('click', () => categoryDialog.close());
categoryEdit.addEventListener('change', () => {
  const selected = categories.find(c => c.id === categoryEdit.value);
  categoryName.value = selected?.name || '';
  categoryParent.value = selected?.parentId || '';
  categoryParent.disabled = Boolean(selected);
  categoryError.textContent = '';
});
document.querySelector('#category-form').addEventListener('submit', event => {
  event.preventDefault();
  categoryError.textContent = saveCategory(categoryEdit.value, categoryName.value, categoryParent.value || null);
  if (categoryError.textContent) return;
  populateCategories();
  showProducts();
  categoryName.value = '';
  categoryEdit.value = '';
  categoryParent.disabled = false;
});
clearFilters.addEventListener('click', () => {
  productSearch.value = '';
  categoryFilter.value = '';
  subcategoryFilter.value = '';
  updateSubcategoryFilter();
  showProducts();
});

productForm.addEventListener('input', updateProductFormState);
productForm.addEventListener('change', updateProductFormState);
document.querySelector('#new-product').addEventListener('click', () => requestFormAction(() => {
  loadProductForm();
  productName.focus();
}));
cancelProductButton.addEventListener('click', () => requestFormAction(() => {
  loadProductForm(selectedProductId);
  productName.focus();
}));
document.querySelector('#keep-editing').addEventListener('click', () => {
  pendingFormAction = null;
  discardDialog.close();
});
discardDialog.addEventListener('cancel', () => { pendingFormAction = null; });
document.querySelector('#discard-changes').addEventListener('click', () => {
  const action = pendingFormAction;
  pendingFormAction = null;
  discardDialog.close();
  action?.();
});

productForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formError.textContent = '';

  const newProduct = readProductDraft();

  const errorMessage = validateProduct(newProduct);
  if (errorMessage !== '') {
    formError.textContent = errorMessage;
    return;
  }
  if (!hasProductChanges() || !productForm.reportValidity()) return;

  if (selectedProductId) {
    const index = products.findIndex(product => product.id === selectedProductId);
    if (index === -1) {
      formError.textContent = 'El producto ya no está disponible.';
      return;
    }
    products[index] = { ...products[index], ...newProduct };
  } else {
    products.push({ id: `product-${nextProductId++}`, ...newProduct });
  }
  // Mostrar el producto recién agregado aunque los filtros anteriores lo ocultaran.
  productSearch.value = '';
  categoryFilter.value = '';
  subcategoryFilter.value = '';
  updateSubcategoryFilter();
  const wasEditing = Boolean(selectedProductId);
  loadProductForm(selectedProductId);
  productFormStatus.textContent = wasEditing ? 'Cambios guardados en esta sesión.' : 'Producto agregado en esta sesión.';
});

populateCategories();
loadProductForm();
