# Machete de JavaScript

JavaScript agrega lógica, datos e interacción.

## Variables y valores

```js
const name = 'Producto A'; // no se reasigna
let stock = 10;            // puede cambiar

const price = 2500;
const active = true;
const emptyValue = null;
```

Preferir `const`. Usar `let` cuando la variable deba recibir otro valor.

## Comparaciones y lógica

```js
price === 2500  // igual de forma estricta
price !== 2500  // diferente
price > 1000
price >= 1000

active && stock > 0 // ambas condiciones
active || stock > 0 // al menos una
!active             // negación
```

## Condiciones

```js
if (stock === 0) {
  console.log('Sin stock');
} else if (stock < 5) {
  console.log('Stock bajo');
} else {
  console.log('Stock disponible');
}
```

## Funciones

```js
function calculateSalePrice(cost, markup) {
  return cost * (1 + markup / 100);
}

const result = calculateSalePrice(2000, 30);
```

Función flecha:

```js
const calculateSubtotal = (price, quantity) => price * quantity;
```

## Arrays

```js
const products = ['Martillo', 'Pinza', 'Destornillador'];

products.push('Taladro');
console.log(products[0]);
console.log(products.length);
```

Recorrer un array:

```js
for (const product of products) {
  console.log(product);
}
```

Métodos frecuentes:

```js
products.map(product => product.toUpperCase());
products.filter(product => product.includes('a'));
products.find(product => product === 'Pinza');
```

## Objetos

```js
const product = {
  id: 1,
  name: 'Martillo',
  price: 8000,
  stock: 4,
};

console.log(product.name);
product.stock = 3;
```

## Eventos del navegador

```js
const button = document.querySelector('#save-button');

button.addEventListener('click', () => {
  console.log('Se presionó Guardar');
});
```

## Modificar HTML

```js
const title = document.querySelector('h1');
title.textContent = 'Productos';

const message = document.createElement('p');
message.textContent = 'Producto guardado';
document.body.append(message);
```

## Módulos

```js
// prices.js
export function calculatePrice(cost, markup) {
  return cost * (1 + markup / 100);
}

// app.js
import { calculatePrice } from './prices.js';
```

## Manejo básico de errores

```js
try {
  riskyOperation();
} catch (error) {
  console.error('Ocurrió un error:', error);
}
```

## Comentarios y consola

```js
// Comentario de una línea

/* Comentario
   de varias líneas */

console.log('Información');
console.error('Error');
```

