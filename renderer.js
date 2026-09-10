const products = [
  {
    name: 'Martillo',
    price: 8500,
    stock: 10,
    unit: 'UNIT',
  },
  {
    name: 'Destornillador',
    price: 4200,
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
const productPrice = document.querySelector('#product-price');
const productStock = document.querySelector('#product-stock');
const productUnit = document.querySelector('#product-unit');





function showProducts() {
  productsList.innerHTML = '';

  for (const product of products) {
    const listItem = document.createElement('li');

    listItem.textContent =
      `${product.name} - ${currencyFormatter.format(product.price)} - ` +
      `Stock: ${quantityFormatter.format(product.stock)} ${unitLabels[product.unit]}`;

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

productUnit.addEventListener('change', updateStockRules);

productForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = productName.value.trim();
  const price = Number(productPrice.value);
  const stock = Number(productStock.value);
  const unit = productUnit.value;

  if (name === '') {
    alert('El producto debe tener un nombre.');
    return;
  }

  if (!Number.isFinite(stock) || stock < 0) {
    alert('El stock debe ser un número igual o mayor que cero.');
    return;
  }

  if (unit === 'UNIT' && !Number.isInteger(stock)) {
    alert('El stock por unidad debe ser un número entero.');
    return;
  }

  const newProduct = {
    name,
    price,
    stock,
    unit,
  };

  products.push(newProduct);
  showProducts();
  productForm.reset();
  updateStockRules();
});

updateStockRules();
showProducts();