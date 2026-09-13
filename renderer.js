const categories = [
  { id: 'baking', name: 'Repostería' },
  { id: 'paper', name: 'Papelera' },
  { id: 'party', name: 'Cotillón' },
];

const products = [
  {
    name: 'Martillo',
    costPrice: 6800,
    markupPercentage: 25,
    salePrice: 8500,
    stock: 10,
    unit: 'UNIT',
  },
  {
    name: 'Destornillador',
    costPrice: 3000,
    markupPercentage: 40,
    salePrice: 4200,
    stock: 6,
    unit: 'UNIT',
  },
];

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

function populateCategories() {
  for (const category of categories) {
    for (const select of [productCategory, categoryFilter]) {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      select.append(option);
    }
  }
}

function normalizeSearch(text) {
  return text.trim().toLocaleLowerCase('es-AR')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function filterProducts(items, search, categoryId) {
  const query = normalizeSearch(search);
  return items.filter(product => {
    const matchesName = normalizeSearch(product.name).includes(query);
    const matchesCategory = categoryId === '' ||
      (categoryId === 'uncategorized' ? !product.categoryId : product.categoryId === categoryId);
    return matchesName && matchesCategory;
  });
}

function validateProduct(product) {
  if (product.name === '') {
    return 'El producto debe tener un nombre.';
  }

  if (product.categoryId && !categories.some(category => category.id === product.categoryId)) {
    return 'Seleccioná un rubro válido.';
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
  const visibleProducts = filterProducts(products, productSearch.value, categoryFilter.value);
  resultsSummary.textContent = visibleProducts.length === 0
    ? 'No hay productos que coincidan con la búsqueda.'
    : `Mostrando ${visibleProducts.length} de ${products.length} productos.`;

  for (const product of visibleProducts) {
    const listItem = document.createElement('li');
    const categoryName = categories.find(category => category.id === product.categoryId)?.name || 'Sin rubro';

    listItem.textContent =
      `${product.name} - ${currencyFormatter.format(product.salePrice)} - ` +
      `Stock: ${quantityFormatter.format(product.stock)} ${unitLabels[product.unit]} · ${categoryName}`;

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
categoryFilter.addEventListener('change', showProducts);
clearFilters.addEventListener('click', () => {
  productSearch.value = '';
  categoryFilter.value = '';
  showProducts();
});

productForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formError.textContent = '';

  const newProduct = {
    name: productName.value.trim(),
    costPrice: productCostPrice.valueAsNumber,
    markupPercentage: productMarkup.valueAsNumber,
    salePrice: productSalePrice.valueAsNumber,
    stock: productStock.valueAsNumber,
    unit: productUnit.value,
    categoryId: productCategory.value || null,
  };

  const errorMessage = validateProduct(newProduct);
  if (errorMessage !== '') {
    formError.textContent = errorMessage;
    return;
  }

  products.push(newProduct);
  // Mostrar el producto recién agregado aunque los filtros anteriores lo ocultaran.
  productSearch.value = '';
  categoryFilter.value = '';
  showProducts();
  productForm.reset();
  updateStockRules();
});

populateCategories();
updateStockRules();
showProducts();
