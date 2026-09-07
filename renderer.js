const productsButton = document.querySelector('#products-button');
const message = document.querySelector('#message');

productsButton.addEventListener('click', () => {
    message.textContent = 'Proximamente mostraremos los productos.';
});


