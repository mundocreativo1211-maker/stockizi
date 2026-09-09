const products = [
  {
    name: 'Martillo',
    price: 8500,
    stock: 10,
  },
  {
    name: 'Destornillador',
    price: 4200,
    stock: 6,
  },
];

const productsButton = document.querySelector('#products-button');
const productsList = document.querySelector('#products-list');
const productForm = document.querySelector('#product-form');
const productName = document.querySelector('#product-name');
const productPrice = document.querySelector('#product-price');
const productStock = document.querySelector('#product-stock');

function showProducts() {
  productsList.innerHTML = '';

  for (const product of products) {
    const listItem = document.createElement('li');

    listItem.textContent =
      `${product.name} - $${product.price} - Stock: ${product.stock}`;

    productsList.append(listItem);
  }
}

productsButton.addEventListener('click', showProducts);
productForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const newProduct = {
    name: productName.value,
    price: Number(productPrice.value),
    stock: Number(productStock.value),
  };

  products.push(newProduct);
  showProducts();
  productForm.reset();
});