# Machete de CSS

CSS controla la apariencia y la distribución de los elementos HTML.

## Regla básica

```css
selector {
  propiedad: valor;
}
```

```css
h1 {
  color: #2563eb;
  font-size: 32px;
}
```

## Selectores

```css
p {}             /* Todas las etiquetas p */
.card {}         /* Elementos con class="card" */
#product-name {} /* Elemento con id="product-name" */
button:hover {}  /* Botón al pasar el mouse */
input:focus {}   /* Input seleccionado */
.menu a {}       /* Enlaces dentro de .menu */
```

## Modelo de caja

```css
.card {
  width: 300px;
  padding: 20px;       /* espacio interior */
  border: 1px solid #ddd;
  margin: 16px;        /* espacio exterior */
  border-radius: 12px;
  box-sizing: border-box;
}
```

## Flexbox

Sirve para acomodar elementos principalmente en una fila o columna.

```css
.toolbar {
  display: flex;
  flex-direction: row;
  justify-content: space-between; /* eje principal */
  align-items: center;            /* eje secundario */
  gap: 12px;
  flex-wrap: wrap;
}
```

Valores útiles de `justify-content`: `flex-start`, `center`, `flex-end`, `space-between` y `space-around`.

## Grid

Sirve para distribuir elementos en filas y columnas.

```css
.products {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
```

Columnas adaptables:

```css
.products {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}
```

## Posición

```css
.parent {
  position: relative;
}

.badge {
  position: absolute;
  top: 8px;
  right: 8px;
}
```

`fixed` fija un elemento a la ventana. `sticky` lo mantiene visible al desplazarse dentro de ciertos límites.

## Diseño adaptable

```css
@media (max-width: 700px) {
  .sidebar {
    display: none;
  }
}
```

## Variables CSS

```css
:root {
  --primary: #2563eb;
  --text: #172033;
}

button {
  background: var(--primary);
  color: white;
}
```

## Comentarios

```css
/* Este es un comentario */
```

