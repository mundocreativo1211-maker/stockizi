# Machete de HTML

HTML define la estructura y el contenido de una interfaz.

## Estructura básica

```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Stockizi</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <h1>Stockizi</h1>
    <script src="script.js"></script>
  </body>
</html>
```

## Etiquetas frecuentes

```html
<h1>Título principal</h1>
<h2>Subtítulo</h2>
<p>Un párrafo.</p>
<a href="https://ejemplo.com">Enlace</a>
<img src="producto.jpg" alt="Descripción del producto" />
<button type="button">Guardar</button>

<ul>
  <li>Elemento de lista</li>
</ul>
```

## Contenedores semánticos

```html
<header>Encabezado</header>
<nav>Navegación</nav>
<main>Contenido principal</main>
<section>Sección</section>
<article>Contenido independiente</article>
<footer>Pie de página</footer>
```

`<div>` es un contenedor genérico. Conviene usar una etiqueta semántica cuando exista una apropiada.

## Formularios

```html
<form>
  <label for="name">Nombre</label>
  <input id="name" name="name" type="text" required />

  <label for="price">Precio</label>
  <input id="price" name="price" type="number" min="0" step="0.01" />

  <select id="supplier" name="supplier">
    <option value="">Elegir distribuidor</option>
    <option value="1">Distribuidora X</option>
  </select>

  <button type="submit">Guardar</button>
</form>
```

## Atributos importantes

- `id`: identificador único de un elemento.
- `class`: clase reutilizable para CSS o JavaScript.
- `name`: nombre del dato enviado por un formulario.
- `type`: tipo de un `input` o un botón.
- `value`: valor del elemento.
- `placeholder`: texto de ejemplo.
- `required`: vuelve obligatorio un campo.
- `disabled`: desactiva un elemento.
- `alt`: describe una imagen.

## Comentarios

```html
<!-- Este texto no se muestra en la interfaz -->
```

