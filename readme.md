# STOCKIZI — Documento maestro del proyecto

# 1. Objetivo del proyecto

Estamos construyendo **Stockizi**, un programa de escritorio para controlar un negocio real.

La prioridad es construir una aplicación funcional que ayude al negocio del usuario y su mamá. También quiere **aprender programación mientras se construye el programa real**; el aprendizaje debe acompañar el avance, no convertirse en una condición que lo frene.

El desarrollo será progresivo y explicado. La dinámica de trabajo y aprendizaje se describe en [DESARROLLO.md](DESARROLLO.md).

La aplicación principal será de **escritorio**, pero tendrá una **interfaz web privada para administrar ciertas cosas desde el celular**.

---

# 2. Arquitectura general prevista

Arquitectura objetivo planificada:

```text
🖥️ Aplicación PC                    📱 Web móvil privada
Electron + React/TypeScript             React/TypeScript
              │                           │
              └─────────────┬─────────────┘
                            ▼
                       API / backend
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
     Base de datos PostgreSQL     Almacenamiento de fotos
```

La PC y el celular deben trabajar con **los mismos datos**.

No queremos una base de datos diferente en cada computadora.

La API será la única puerta de acceso a los datos compartidos. Esto permitirá que:

* Se modifique un precio desde el celular.
* La PC vea el cambio.
* Se agregue un producto desde la PC.
* El celular lo vea.
* Se consulte stock desde el celular.
* Se consulten gastos/caja desde el celular.

---

# 3. Tecnologías

Tecnologías implementadas actualmente:

* Node.js
* npm
* Electron
* HTML
* CSS
* JavaScript
* Git y GitHub

Tecnologías planificadas:

* TypeScript.
* React para la interfaz de escritorio y la web móvil.
* API/backend todavía por definir en detalle.
* PostgreSQL como base de datos central.
* Almacenamiento central para fotos.
* Posiblemente Prisma para acceder a PostgreSQL; esta elección todavía no está cerrada.

La versión actual con HTML, CSS y JavaScript es un prototipo de aprendizaje. La migración a React/TypeScript se hará de forma progresiva y explicada.

---

# 4. Estado actual del proyecto

La carpeta está en:

```text
C:\Users\ezema\Desktop\stockizi
```

Actualmente contiene:

```text
stockizi/
├── .gitignore
├── apuntes/
├── tests/
├── node_modules/
├── DESARROLLO.md
├── index.html
├── main.js
├── navigation.js
├── package-lock.json
├── package.json
├── readme.md
├── renderer.js
├── styles.css
└── stockizi.md
```

Node instalado:

```text
Node.js v26.7.0
npm 11.19.0
```

Electron ya fue instalado.

Estado comprobado:

* `npm start` abre la aplicación de escritorio.
* Electron carga `index.html` desde `main.js`.
* `styles.css` contiene la presentación visual.
* `catalog.js` maneja consulta y edición limitada. `preload.js` expone consulta y guardado de productos; `main.js` llama a la API mediante `api-client.js`, sin entregar credenciales a la pantalla.
* Productos permite buscar por nombre, editar precios y crear productos con stock inicial; el usuario confirmó el alta y su presencia en la API. También confirmó rubros/subcategorías editables, clasificación y filtros. Los múltiples códigos y su búsqueda exacta están implementados y probados, pendientes de aplicar `006_product_codes.sql` en su base. Cambios posteriores de stock/unidad siguen bloqueados.
* En escritorio, el catálogo se desplaza arriba y la ficha permanece visible abajo. `renderer.js` conserva el prototipo anterior de edición local, pero ya no se carga desde `index.html`.
* `navigation.js` conecta Inicio, Nueva venta, Productos y Caja en una barra lateral. Inicio muestra el estado del prototipo; Ventas y Caja todavía son secciones informativas pendientes de implementación.
* La rama actual es `feature/productos-iniciales`.
* Existe un formulario provisional de productos con nombre, costo, markup, precio de venta, stock y unidad.
* Los productos consultados se muestran con moneda argentina y cantidades de hasta tres decimales. No se mezclan con datos de ejemplo locales.
* Existe PostgreSQL local (`stockizi_dev`) y una API de consulta, edición limitada y alta. La edición real fue confirmada por el usuario; el alta se probó en PostgreSQL aislado y espera la migración 004 en su base.
* `npm test` ejecuta pruebas automáticas del cálculo, validación y guardado provisional mediante Node.js, sin abrir Electron.
* React, TypeScript y la interfaz móvil aún no están implementados. La API actual es local, no está lista para acceso desde otros equipos.

`node_modules/` está instalado localmente y excluido de Git. Los nuevos archivos dentro de `apuntes/` también están ignorados; los apuntes que ya habían sido confirmados antes continúan registrados en el historial.

---

# 5. Cómo queremos desarrollar

No queremos hacer todo de golpe.

Hoja de ruta aproximada:

```text
FASE 0 — Fundamentos (COMPLETADA)
Electron, npm, archivos principales, CSS separado y flujo Git/GitHub.

FASE 1 — Prototipo de aprendizaje (EN CURSO)
JavaScript, formulario de productos, unidades y navegación inicial.

FASE 2 — Base técnica de la interfaz (PLANIFICADA)
React, TypeScript, componentes, navegación y estructura del proyecto.

FASE 3 — Datos centrales (PLANIFICADA)
API, PostgreSQL, persistencia, productos, stock y distribuidores.

FASE 4 — Operación comercial (PLANIFICADA)
Compras, ventas, pagos, presupuestos y cuenta corriente.

FASE 5 — Dinero y control (PLANIFICADA)
Caja, gastos, retiros, reservas, cierre y resumen diario.

FASE 6 — Acceso móvil y colaboración (PLANIFICADA)
Web privada, tareas, actualización de precios y carga de fotos.

FASE 7 — Seguridad y entrega (PLANIFICADA)
Usuarios, permisos, copias de seguridad, pruebas, instalador y despliegue.
```

El orden puede cambiar si durante el desarrollo encontramos una razón técnica para hacerlo.

Las fases indican un orden de construcción, no versiones automáticamente listas para usar en el negocio. Pruebas, integridad de datos, seguridad y copias de respaldo se incorporarán durante el desarrollo de las funciones correspondientes, no solamente al final.

## 5.1. Navegación prevista

La aplicación de escritorio utilizará una barra lateral para poder crecer sin acumular demasiadas pestañas horizontales.

Organización inicial:

```text
STOCKIZI

OPERACIÓN DIARIA
├── Inicio
├── Nueva venta
├── Productos
└── Caja

GESTIÓN
├── Compras
├── Distribuidores
├── Clientes
├── Cuenta corriente
├── Presupuestos
└── Gastos

ANÁLISIS
├── Historial
├── Reportes
└── Resumen diario

SISTEMA
├── Usuarios
└── Configuración
```

Responsabilidades principales:

* `Inicio`: resumen del día, estado de caja, tareas pendientes y alertas de stock.
* `Nueva venta`: carrito, búsqueda de productos, cantidades, precios y pagos.
* `Productos`: catálogo, precios, stock, unidades, fotos y códigos.
* `Caja`: apertura, movimientos, retiros, reservas y cierre.
* `Compras`: ingreso de mercadería y actualización de costos.
* `Distribuidores`: proveedores y productos asociados.
* `Clientes`: información necesaria de clientes.
* `Cuenta corriente`: deudas y cobros posteriores.
* `Presupuestos`: operaciones que todavía no son ventas.
* `Gastos`: egresos del negocio.
* `Historial`: operaciones anteriores.
* `Reportes`: estadísticas, rentabilidad e información de Posnet/ARCA.
* `Usuarios`: empleados, acceso y permisos.
* `Configuración`: redondeo, datos del negocio y preferencias.

No se usará una única sección genérica llamada `Contabilidad`, porque caja, gastos, compras, cuenta corriente y reportes representan conceptos diferentes. Pueden agruparse visualmente sin mezclar su lógica.

La primera navegación funcional se centrará en:

```text
Inicio
Nueva venta
Productos
Caja
```

Estas cuatro secciones son un punto de partida para desarrollar la interfaz, no el alcance completo de la primera versión operativa.

## 5.2. Alcance para incorporar Stockizi al negocio

El prototipo de aprendizaje y una versión operativa son cosas diferentes. No se considerará suficiente una versión pequeña que omita tareas indispensables del negocio.

El alcance operativo debe contrastarse con los requisitos de este documento y con la aplicación que ya se usa. Incluye casi todas las funciones de negocio ya nombradas:

* Productos, rubros, múltiples códigos, fotos, unidades y control de stock.
* Costos, markup, redondeo, precios minoristas/mayoristas y actualización individual o masiva.
* Distribuidores, compras e ingreso de mercadería.
* Ventas, carrito, búsqueda rápida, venta por peso, modificación manual de precios y advertencia de stock negativo.
* Pagos por distintos medios, pagos combinados, historial y correcciones auditables.
* Presupuestos, clientes y cuenta corriente.
* Apertura/cierre de caja, movimientos, gastos, retiros, reservas y resumen diario.
* Reportes y la información necesaria para el flujo de Posnet/ARCA.
* Acceso móvil administrativo, tareas pendientes y carga de fotos según las necesidades acordadas.
* Persistencia confiable, respaldo y acceso seguro para la forma real de trabajo.

Antes de poner Stockizi en uso se verificará cada tarea indispensable mediante escenarios reales, incluidos errores y correcciones. No se inventarán requisitos faltantes ni se eliminarán funciones necesarias para reducir artificialmente el alcance.

La aplicación actual y sus secciones ya fueron identificadas por el usuario; se describen en la sección 5.3. Todavía debe decidirse si Stockizi la reemplazará o la complementará y qué migración o convivencia será necesaria.

Una web pública de compras y otras expansiones no necesarias para la operación actual pueden quedar para el futuro. Las variantes por color y la conversión automática de bultos siguen en la sección de ideas futuras por decisión del usuario.

## 5.3. Sistema actual y transición

Información confirmada por el usuario:

* El negocio usa StockFácil de [VP Sistemas](https://www.vpsistemas.com/).
* Actualmente trabajan con una computadora.
* El programa permite exportar o trasladar productos mediante Excel.
* Las secciones identificadas son: artículos, proveedores, clientes, ventas, caja, estadísticas, gastos y contabilidad.

El alcance deseado y los cambios respecto al sistema actual siguen siendo los descritos en este README. El usuario continuará completándolo para ordenar productos y contabilidad; los nombres de las secciones de StockFácil no obligan a copiar su organización ni confirman todos sus detalles operativos.

Pendientes antes de diseñar una importación o transición:

* Contrastar el archivo de ejemplo ya revisado con una exportación completa del negocio antes de migrar.
* Definir cómo importar unidades de medida, subrubros, fotos y códigos adicionales, ausentes en el ejemplo.
* Comprobar si pueden exportarse clientes, proveedores, deudas o historial; no se presupone esa capacidad.
* Decidir qué información se migrará y cómo se validará, sin sobrescribir datos reales accidentalmente.
* Definir reemplazo o convivencia con StockFácil y las tareas indispensables para poner Stockizi en uso.

El 13/09/2026 se inspeccionó `apuntes/ejemplo/ejemplom excel articulos.xlsx`: contiene una hoja `Sheet1`, 6 artículos de prueba y 14 columnas. Confirma que este ejemplo incluye códigos, stock, costos y precios; no confirma que puedan exportarse otras entidades ni que todos los archivos futuros tengan el mismo formato.

## 5.4. Referencia revisada: videos y Excel de StockFácil

Se revisaron fotogramas de los cuatro videos de `apuntes/ejemplo/` y la transcripción automática local de sus audios. Las explicaciones se contrastaron con las pantallas; los importes de prueba y las dudas del usuario no se convierten en reglas definitivas. No se ejecutaron operaciones sobre la base del negocio.

### Funcionamiento y necesidades observadas

* `interfaz, articulos.mp4` (2:14): catálogo arriba y ficha abajo, selección, modificación y creación; Guardar se habilita en edición. Hay acceso a familias y proveedores desde la ficha, códigos con letras, foto y venta por kilo/litro/metro. Se mostraron problemas y dudas del programa de referencia que no deben copiarse. La caja de pizza marcada por peso es un ejemplo de prueba, no un cambio de la regla de unidades enteras de Stockizi.
* `ventas.mp4` (2:29): es la pantalla donde más tiempo trabaja el usuario. Se busca y selecciona un artículo sin perder la venta, se modifica el precio del renglón sin cambiar el catálogo, y se ingresa cantidad en gramos o importe para venta por peso. Se muestran contado/Mercado Pago, descuentos, recargos y artículo rápido con descripción y precio para mercadería todavía no cargada. Las listas de precios y las promociones necesitan definición propia; el usuario indicó que las promociones pueden omitirse por ahora. No se presupone el alcance de devoluciones por la sola presencia del botón.
* `proveedores clientes compras.mp4` (1:45): el usuario no utiliza actualmente proveedores ni clientes en StockFácil y no tiene claro su funcionamiento. Quiere poder usar Compras con una interfaz más simple. Se muestran usuarios y permisos; su alcance sigue por decidir. Esto no elimina las funciones ya planificadas para Stockizi.
* `contabilidad.mp4` (3:14): interesa el inicio de caja, los movimientos separados por medio de pago, la consulta de ventas por día/mes/rango y el detalle de cada venta. El usuario consulta ese detalle desde Contabilidad, no habitualmente desde Artículos vendidos de Caja. Para corregir un medio de pago hoy vuelve a cargar la operación mediante presupuesto y anula la anterior: quiere un procedimiento más cómodo.

Propuestas pendientes de acordar antes de implementar:

* Corregir el medio de pago desde el historial, conservando venta, stock y trazabilidad. Definir permisos, motivo, tratamiento de cajas cerradas y actualización de los movimientos; no borrar ni duplicar ventas silenciosamente.
* Definir artículo rápido: si crea o no un producto, cómo se registra su costo y cómo se trata su stock. No asumir costo cero como ganancia real.
* Definir límites, orden de aplicación, permisos y redondeo de descuentos y recargos.
* Mostrar el inventario a costo con ese nombre, distinguiéndolo de ventas, costo de mercadería vendida y resultado bruto. El costo histórico de cada venta debe conservarse al cambiar costos actuales. El resultado bruto no representa por sí solo el resultado después de gastos.

### Columnas del Excel de ejemplo

`CODIGO`, `DETALLE`, `FAMILIA`, `PROVEEDOR`, `MARCA`, `P.COSTO`, `P.VENTA`, `IVA`, `P.LISTA2`, `P.LISTA3`, `P.MAYOR`, `STOCK`, `STOCK MIN`, `STOCK IDEAL`.

Observaciones para diseñar el importador, todavía no implementado:

* Hay códigos numéricos y alfanuméricos: tratarlos como identificadores de texto. Si un origen numérico ya perdió ceros iniciales, no pueden recuperarse por suposición.
* Hay familia, proveedor y marca vacíos. `FAMILIA` podría mapearse a rubro, pero debe confirmarse; no inventar asociaciones por el contenido de un nombre.
* Hay stock negativo y un valor `-0.375999987125397`. Conservar el dato original para revisión y acordar normalización a la precisión de la unidad, sin convertir negativos en cero ni redondear silenciosamente unidades enteras.
* No hay una columna de unidad de medida, subrubro, foto ni códigos alternativos. No deducirlos únicamente del nombre del artículo.
* El IVA incluye un valor de prueba 34; no convertirlo en configuración fiscal por defecto. Las listas 2/3 y el precio mayorista no definen por sí solos reglas de descuentos o cantidades mínimas.
* Propuesta de importación: vista previa de correspondencias, duplicados, faltantes y errores antes de confirmar; no sobrescribir datos existentes automáticamente.

Los videos, fotogramas y transcripciones no se incorporan al código ni a Git. La extracción y transcripción se realizaron en una carpeta temporal fuera del proyecto.

---

# 6. Flujo diario del negocio

El usuario describió este flujo real:

```text
Abrir caja
↓
Actualizar precios
↓
Vender productos
↓
Buscar stock/productos
↓
Buscar por nombre o código de barras
↓
Pagar proveedores
↓
Vender por mayor
↓
Pasar ventas de Posnet a ARCA
↓
Cerrar caja
↓
Revisar resumen
↓
Separar dinero para reposición/inversión
↓
Dejar dinero para iniciar la caja del día siguiente
↓
Cargar presupuestos de ventas anteriores que vinieron a pagar
↓
Corregir ventas que fueron cargadas como contado pero realmente fueron transferencia
```

---

# 7. Funciones deseadas

Stockizi debe permitir:

* Cargar productos.
* Editar productos.
* Eliminar/desactivar productos.
* Buscar productos.
* Buscar por nombre.
* Buscar por cualquiera de los códigos de barras asociados a un producto.
* Filtrar productos por rubro o categoría.
* Ofrecer una búsqueda visual por nombre y foto para agilizar ventas y cambios de precio.
* Controlar stock.
* Manejar productos por unidad, peso, longitud o volumen.
* Permitir ventas con stock insuficiente, mostrando una advertencia y conservando el stock negativo.
* Avisar cuando un producto tiene poco stock.
* Mostrar foto del producto.
* Poder ampliar/ver la foto del producto.
* Filtrar productos que todavía no tienen foto.
* Asociar productos a distribuidores.
* Actualizar precios individualmente.
* Actualizar precios de varios productos.
* Aumentar precios por cantidad fija.
* Aumentar precios por porcentaje.
* Actualizar precios desde el celular.
* Crear y completar recordatorios de actualización.
* Ver productos de un distribuidor.
* Registrar compras.
* Registrar pagos a proveedores.
* Registrar ventas.
* Registrar pagos.
* Manejar ventas en efectivo.
* Manejar transferencias.
* Manejar Posnet/tarjeta.
* Manejar presupuestos.
* Manejar cuenta corriente.
* Controlar caja diaria.
* Registrar gastos.
* Separar dinero para reposición/inversión.
* Ver estadísticas.
* Ver historial.
* Preparar información relacionada con ventas de Posnet para ARCA.
* Tener resumen diario.
* Poder utilizarse en más de una PC.
* Tener administración desde celular.

---

# 8. Producto

Los campos definidos para `Product` son:

```text
id
name
description
costPrice
markupPercentage
salePrice
margin (calculado)
barcodes
supplierId
categoryId
subcategoryId
stock
unit
lowStockThreshold
wholesaleMinimumQuantity
wholesalePrice
photoReference
active
createdAt
updatedAt
```

El usuario originalmente los definió como:

```text
nombre
descripción
precio de costo
porcentaje de venta
precio de venta
margen
código o códigos
distribuidor
xmayo
precio xmayor
foto
```

Interpretación:

* `name`: nombre del producto.
* `description`: descripción.
* `costPrice`: precio/costo actual.
* `markupPercentage`: porcentaje que se agrega al costo para calcular venta.
* `salePrice`: precio de venta actual.
* `margin`: valor calculado para reportes; queda por decidir si también debe persistirse.
* `barcodes`: colección de códigos que permiten encontrar el mismo producto.
* `supplierId`: distribuidor asociado en el modelo inicial; la relación definitiva está por decidir.
* `categoryId`: rubro o categoría principal del producto.
* `subcategoryId`: subcategoría opcional perteneciente al rubro elegido en el prototipo actual.
* `stock`: cantidad disponible del producto. Debe admitir decimales.
* `unit`: unidad de medida utilizada para interpretar el stock y las cantidades.
* `lowStockThreshold`: cantidad a partir de la cual se muestra una alerta de stock bajo.
* `wholesaleMinimumQuantity`: cantidad desde la que empieza el precio mayorista.
* `wholesalePrice`: precio por mayor.
* `photoReference`: URL o clave que permite localizar la foto fuera de la tabla del producto.
* `active`: permite desactivar el producto sin perder su historial.
* `createdAt` y `updatedAt`: fechas de creación y última actualización.

## 8.1. Stock y unidades de medida

El stock no siempre representa unidades enteras. Algunos productos pueden venderse por peso, longitud o volumen.

Ejemplos:

```text
10 unidades
1,200 kilogramos
3,500 metros
2,250 litros
```

La precisión depende de la unidad:

* `UNIT`: solo admite cantidades enteras. No es válido tener `1,4` cajas o `2,5` unidades.
* `KILOGRAM`: admite hasta tres decimales. `1,200 kg` representa 1 kilo y 200 gramos.
* `METER`: admite hasta tres decimales.
* `LITER`: admite hasta tres decimales.

La interfaz y el backend deben validar esta regla; no alcanza con cambiar el `step` visual del campo.

Unidades iniciales previstas:

```text
UNIT
KILOGRAM
METER
LITER
```

La lista podrá ampliarse si el negocio incorpora otras formas de venta.

En la interfaz se mostrarán abreviaturas fáciles de leer:

```text
UNIT      → un.
KILOGRAM  → kg
METER     → m
LITER     → l
```

Las cantidades de compras (`PurchaseItem.quantity`) y ventas (`SaleItem.quantity`) deben respetar la unidad del producto. Serán enteras para `UNIT` y podrán ser decimales para peso, longitud o volumen.

En PostgreSQL se utilizará un tipo decimal exacto, por ejemplo:

```text
NUMERIC(12, 3)
```

No se utilizará un tipo de coma flotante para cantidades comerciales, con el fin de evitar errores de precisión.

## 8.2. Fotos de productos

La foto ayudará a identificar un producto cuando el nombre o el código no sean suficientes.

La aplicación debe permitir:

* Cargar o reemplazar una foto desde la PC.
* Tomar una foto o elegirla desde el celular.
* Ver una lista filtrada de productos que todavía no tienen foto.
* Ampliar la imagen desde la ficha o la búsqueda del producto.
* Mostrar una imagen indicativa cuando el producto no tenga foto.

La interfaz móvil tendrá una acción rápida llamada `Productos sin foto`. El flujo esperado será:

```text
Productos sin foto
↓
Elegir producto
↓
Abrir cámara o galería
↓
Confirmar imagen
↓
La foto queda disponible en PC y celular
```

Para mantener el sistema escalable, la base de datos no guardará inicialmente el archivo pesado dentro de `Product`. Guardará una referencia como una URL o clave de almacenamiento. La imagen se almacenará en un servicio o espacio central compartido, con compresión y una miniatura para las listas. La tecnología concreta de almacenamiento se decidirá antes de implementar esta función.

## 8.3. Códigos de barras y variantes

Un producto podrá tener más de un código de barras. Esto cubre, entre otros casos, el mismo artículo comprado en lugares diferentes con códigos distintos.

No se guardarán todos los códigos en un único texto dentro de `Product`. Se utilizará una relación conceptual:

```text
Product
   ↓
ProductBarcode
--------------
id
productId
code
label       opcional
active
```

Ejemplo actual:

```text
Producto: Caja organizadora mediana

7790000000110 → Código del proveedor A
7790000000127 → Código del proveedor B
```

Todos los códigos permiten encontrar el mismo producto y comparten su precio y stock.

Cada código debe ser único dentro de Stockizi para evitar que un escaneo encuentre dos productos diferentes.

Implementación actual: `product_codes` relaciona `product_id` con códigos de texto de hasta 100 caracteres. Conserva letras y ceros iniciales; recorta espacios de los extremos y distingue mayúsculas/minúsculas. No exige formato EAN ni convierte códigos a números. El campo descriptivo `label` queda pendiente.

En la ficha de un producto ya guardado, **Códigos** permite agregar y quitar. Cada operación se guarda inmediatamente, separada del botón Guardar de la ficha; no se abre con cambios pendientes. Quitar pide una segunda confirmación y desactiva la asociación sin borrar el producto ni alterar stock/precio. Un código quitado puede volver a asignarse explícitamente; la asociación anterior se conserva inactiva. Esto no constituye todavía auditoría de empleados ni de fecha/motivo de retiro.

Un índice único de códigos activos impide compartir código entre dos productos, incluso con solicitudes simultáneas. Repetir un alta para el mismo producto devuelve la asociación existente. Tras un fallo incierto, consultar otra vez antes de seguir. **Buscar código** (o Enter en ese campo) consulta toda la base y selecciona el producto, limpiando filtros de nombre y rubro. Nombre/rubro siguen buscando solo entre productos cargados. No se reemplaza un borrador sin guardar. La conexión con Nueva venta y la prueba con lector físico quedan pendientes.

El alcance inicial no manejará stock separado por color o presentación. Esa posibilidad queda registrada como idea futura mediante variantes de producto.

## 8.4. Rubros, categorías y búsqueda visual

El usuario crea y renombra sus propios rubros. No vienen definidos por el programa. Ejemplos posibles:

```text
Repostería
Papelería
Cotillón
```

Se utiliza una entidad separada para no repetir el nombre del rubro dentro de cada producto. El modelo ampliado propuesto inicialmente es:

```text
Category
--------
id
name
parentId    opcional
active
createdAt
updatedAt
```

La implementación SQL actual separa `categories` (rubros) y `subcategories` (subcategorías, con `category_id` como padre), manteniendo un nivel de profundidad. Los campos active/createdAt/updatedAt del modelo ampliado siguen pendientes. Por ejemplo:

```text
Cotillón
├── Globos
├── Velas
└── Decoración
```

La vista conectada permite crear y renombrar ambos nombres, sin listas predefinidas, mediante Administrar rubros. Rubro y subcategoría son opcionales; los productos anteriores quedan Sin rubro hasta asignarlos. Renombrar conserva el ID y las relaciones. La base impide asignar una subcategoría de otro rubro mediante una clave foránea compuesta. No permite nombres duplicados ignorando mayúsculas dentro del mismo nivel y rubro (conserva diferencias de tildes). Las mismas subcategorías pueden existir en rubros distintos. Reintentar un alta con el mismo nombre recupera la existente; renombrar exige el nombre original para no pisar cambios simultáneos. No hay traslado ni eliminación.

Los filtros por nombre, rubro y subcategoría se combinan sobre los productos cargados. Si quedan páginas, la pantalla avisa; todavía no es una búsqueda de toda la base. Cambiar el rubro limpia la subcategoría del borrador para evitar vínculos cruzados. Un fallo de consulta de rubros deshabilita su edición/filtro y muestra el error, sin borrar clasificaciones guardadas ni impedir consultar precios.

Distribución acordada para escritorio: catálogo y filtros arriba, con desplazamiento propio de la lista; formulario compacto siempre visible abajo. En pantallas pequeñas se permite desplazar la página para mantener accesibles todos los campos.

La sección `Productos` permitirá:

* Elegir un rubro.
* Buscar por parte del nombre.
* Buscar por cualquiera de sus códigos.
* Ver resultados con nombre, foto, precio y stock.
* Abrir rápidamente el producto para modificar precio u otros datos.

La sección `Nueva venta` reutilizará la misma búsqueda rápida. Además del lector de código de barras, el empleado podrá elegir rubro y reconocer el producto por nombre y foto. La presentación visual debe priorizar velocidad y botones fáciles de seleccionar.

---

# 9. Precio de venta

Decidimos utilizar **markup sobre costo**.

Ejemplo:

```text
Costo: $2.000
Markup: 30%

Precio:
$2.000 × 1,30 = $2.600
```

Esto es diferente de calcular un margen porcentual sobre el precio final.

El porcentaje de venta representa cuánto se agrega sobre el costo.

Decisión confirmada: al guardar la ficha de un producto, el precio de venta no puede ser menor que el costo. La igualdad está permitida. La pantalla y la API bloquean importes inválidos; la migración `003` agrega la misma restricción en PostgreSQL, sin corregir datos existentes automáticamente. Esta decisión corresponde al catálogo; las reglas de descuentos y precios excepcionales en una venta se revisarán al implementar Ventas.

En el formulario conectado, cambiar el porcentaje calcula la venta sugerida redondeada a centavos mediante enteros en `pricing.js`. Regla corregida por pedido del usuario: cambiar costo mantiene el porcentaje disponible y recalcula la venta; cambiar venta manualmente recalcula el porcentaje. Se conserva el porcentaje al vaciar transitoriamente el costo mientras se escribe, sin permitir guardar datos inválidos. Con costo cero el porcentaje se deshabilita, se ingresa venta directamente y se guarda porcentaje nulo; si todavía no hay porcentaje, no se inventa uno para calcular una venta. Un porcentaje inválido conserva la venta anterior pero bloquea Guardar y Enter hasta corregir o cancelar. Se validan hasta diez dígitos enteros y dos decimales y los límites almacenados. La API sigue recibiendo costo y venta y deriva el porcentaje efectivo: por redondeo a centavos puede diferir del porcentaje sugerido escrito, especialmente en costos muy pequeños. No requiere nueva migración SQL.

Al crear o editar un producto, Stockizi calculará un precio de venta sugerido:

```text
salePrice = costPrice × (1 + markupPercentage / 100)
```

El precio sugerido podrá corregirse manualmente antes de guardar. También se permitirá modificar el precio aplicado durante una venta cuando el negocio lo necesite.

En el formulario de productos, editar manualmente el precio de venta actualiza el porcentaje sobre costo: `((salePrice - costPrice) / costPrice) × 100`. Por ejemplo, costo $1.220 y venta $1.900 muestran aproximadamente 55,74 %. El porcentaje se muestra con dos decimales sin recalcular ni alterar el precio manual. Con costo cero este porcentaje no puede calcularse: el campo queda vacío para no mostrar un valor falso.

Para conservar la auditoría, una venta deberá distinguir entre:

```text
precio de lista
precio realmente aplicado
```

Queda por decidir qué permisos o motivo se exigirán para modificar manualmente un precio durante una venta.

---

# 10. Redondeo de precios

El usuario quiere que Stockizi redondee automáticamente los precios para ahorrar tiempo.

El redondeo será configurable.

Por ejemplo:

```text
Redondear a:

$1
$10
$50
$100
$500
```

Ejemplo:

```text
Costo: $2.137
Markup: 30%

Resultado:
$2.778,10

Redondeado a $100:
$2.800
```

---

# 11. Actualización automática de precios

Cuando cambia el costo de un producto, Stockizi podrá calcular un nuevo precio utilizando el markup configurado.

Ejemplo:

```text
Costo anterior: $2.000
Costo nuevo: $2.200

Markup: 30%

Nuevo precio sugerido:
$2.860

Redondeado:
$2.900
```

La idea es que Stockizi pueda preguntar:

```text
¿Actualizar precio de venta a $2.900?

[ Sí ] [ No ]
```

La actualización automática debe diseñarse con cuidado para que el usuario tenga control.

---

# 12. Precio mayorista

El producto puede tener un precio mayorista.

Ejemplo:

```text
Precio normal: $2.600

Cantidad mínima mayorista: 5

Precio mayorista: $2.400
```

Entonces:

```text
1 → $2.600
2 → $2.600
3 → $2.600
4 → $2.600
5 → $2.400
6 → $2.400
...
```

La cantidad mínima será configurable por producto.

---

# 13. Distribuidores

El usuario NO necesita mucha información administrativa de los distribuidores.

Lo importante es:

```text
Supplier
--------
id
name
active
createdAt
updatedAt
```

La función principal será:

```text
Distribuidores
↓
Elegir distribuidor
↓
Ver productos asociados
↓
Modificar precios
```

Ejemplo:

```text
DISTRIBUIDORA X

Producto       Costo       Venta

Producto A     $2.000      $2.600
Producto B     $3.000      $3.900
Producto C     $1.500      $2.000
```

---

# 14. Actualización masiva desde distribuidor

El usuario quiere poder seleccionar varios productos de un distribuidor y aplicar un aumento.

Ejemplo:

```text
☑ Producto A
☑ Producto B
☑ Producto C

Aumentar:

+$100

o

+5%

[ Aplicar ]
```

Esto debe actualizar los precios de los productos seleccionados.

---

# 15. Administración desde celular

Se quiere una interfaz web privada para poder realizar tareas administrativas desde el teléfono.

No queremos copiar toda la aplicación de escritorio al celular.

La versión móvil debe centrarse en acciones rápidas:

```text
Productos
Distribuidores
Precios
Stock
Caja
Gastos
Ventas
```

Funciones especialmente importantes desde celular:

* Actualizar precios.
* Actualizar productos.
* Aumentar precios de productos de un distribuidor.
* Crear recordatorios para actualizar productos o precios.
* Consultar y completar tareas pendientes.
* Ver productos sin foto y agregarles una imagen usando la cámara o galería.
* Ver stock.
* Ver productos con stock bajo.
* Ver caja.
* Registrar gastos.
* Consultar ventas.
* Consultar información del negocio.

## 15.1. Recordatorios y tareas pendientes

Stockizi tendrá una bandeja de tareas visible desde el celular y desde el inicio de la aplicación de escritorio.

Casos iniciales:

```text
Recordar actualizar precios de un distribuidor
Recordar revisar uno o varios productos
Completar fotos faltantes
Revisar productos con stock bajo
```

Una tarea podrá ser general o estar relacionada con un producto o distribuidor. Estructura conceptual inicial:

```text
Task
----
id
type
title
note
productId       opcional
supplierId      opcional
dueAt           opcional
status
createdAt
completedAt     opcional
createdByUserId
```

Tipos iniciales posibles:

```text
PRODUCT_UPDATE
PRICE_UPDATE
MISSING_PHOTO
LOW_STOCK_REVIEW
OTHER
```

Estados iniciales:

```text
PENDING
COMPLETED
CANCELLED
```

Primero se implementará la bandeja de tareas dentro de Stockizi. Las notificaciones automáticas del teléfono se evaluarán más adelante, porque requieren permisos, horarios y una tecnología de notificaciones que todavía no fue elegida.

---

# 16. Compras

Los proveedores actualmente se pagan **en el momento**.

Sin embargo, queremos diseñar el sistema de forma suficientemente flexible para poder soportar pagos parciales o deuda en el futuro.

Estructura conceptual:

```text
Supplier
   ↓
Purchase
   ↓
PurchaseItem
   ↓
Product
```

`Purchase`:

```text
id
supplierId
total
createdAt
```

`PurchaseItem`:

```text
id
purchaseId
productId
quantity
unitCost
subtotal
```

En el alcance inicial, las compras se cargarán directamente en la unidad base de stock del producto, aunque físicamente se hayan comprado bultos.

Ejemplos:

```text
1 bulto con 12 cajas → cargar quantity = 12 UNIT
1 bolsa de 25 kg     → cargar quantity = 25 KILOGRAM
```

La conversión automática de bultos a unidades queda como idea futura. De esta manera el modelo inicial es simple y el stock conserva una unidad coherente.

---

# 17. Qué sucede cuando se registra una compra

Ejemplo:

```text
Distribuidor: Distribuidora X

10 × Producto A → $2.000
20 × Producto B → $3.500

Total: $90.000
```

Al confirmar la compra:

```text
1. Aumenta el stock.
2. Guarda el costo de los productos.
3. Guarda la compra en el historial.
4. Registra el pago.
5. Registra la salida de dinero.
6. Conserva el historial del costo.
```

---

# 18. Historial de costos

No queremos perder los costos anteriores.

Un producto podría haber costado:

```text
02/08 → $2.000
10/08 → $2.300
18/08 → $2.500
```

Aunque `Product.costPrice` tenga actualmente:

```text
$2.500
```

las compras anteriores conservan el costo histórico.

Esto permitirá posteriormente analizar aumentos de proveedores y rentabilidad.

---

# 19. Ventas

Una venta debe guardar los productos vendidos.

Conceptualmente:

```text
Sale
 ↓
SaleItem
 ↓
Product
```

Una venta contiene uno o varios `SaleItem`.

`SaleItem` debe guardar al menos:

```text
productId
quantity
listUnitPrice
unitPrice
subtotal
priceEntryMode
```

* `quantity`: cantidad expresada en la unidad principal del producto.
* `listUnitPrice`: precio de lista por unidad principal al momento de vender.
* `unitPrice`: precio por unidad principal realmente aplicado.
* `subtotal`: importe final de ese renglón.
* `priceEntryMode`: indica si la operación se inició ingresando cantidad o importe.

También es recomendable guardar el costo al momento de la venta para poder calcular rentabilidad histórica correctamente:

```text
unitCost
```

## 19.1. Venta por peso

Para un producto cuya unidad sea `KILOGRAM`, el precio de venta se interpreta como precio por kilogramo.

Al seleccionar el producto durante una venta, la interfaz permitirá ingresar:

```text
gramos o kilogramos
importe total
```

Los campos estarán relacionados. Si se ingresa la cantidad, Stockizi calcula el importe:

```text
Precio por kg: $4.000
Cantidad: 300 g = 0,300 kg
Importe: $1.200
```

Si se ingresa el importe, Stockizi calcula la cantidad correspondiente:

```text
Precio por kg: $4.000
Importe pedido: $1.000
Cantidad: 250 g = 0,250 kg
```

El stock siempre se descontará usando la unidad principal del producto. En el ejemplo anterior se descontará `0,250 kg`, aunque el usuario haya escrito `$1.000`.

La base de datos guardará la cantidad normalizada en kilogramos, el precio de lista, el precio aplicado y el subtotal. No será necesario guardar una existencia separada en gramos.

La misma idea podrá aplicarse posteriormente a metros y litros. Las reglas exactas de redondeo entre cantidad e importe deben definirse antes de implementar ventas reales.

---

# 20. Qué sucede cuando se hace una venta

Cuando se confirma una venta normal:

```text
1. Baja el stock.
2. Se registra la venta.
3. Se registran los productos vendidos.
4. Se registra el/los pagos.
5. Entra dinero si corresponde.
6. Aumentan las estadísticas.
7. Aparece en el historial.
```

## 20.1. Venta sin stock disponible

Stockizi permitirá confirmar una venta aunque no haya stock suficiente. La operación no se bloqueará.

Ejemplo:

```text
Stock actual: 0 un.
Cantidad vendida: 1 un.
Stock resultante: -1 un.
```

Antes de confirmar, la interfaz debe advertir claramente que la venta dejará stock negativo. Si el usuario continúa:

```text
1. Se confirma la venta normalmente.
2. El stock queda negativo.
3. Se registra el movimiento que produjo el faltante.
4. El producto aparece en alertas y tareas de regularización.
```

El stock negativo no debe corregirse silenciosamente ni convertirse automáticamente en cero, porque eso ocultaría la diferencia real. Cuando se reponga o ajuste el producto, el historial debe permitir entender cómo volvió a una cantidad correcta.

Queda por decidir si cualquier usuario podrá confirmar la advertencia o si ciertos roles necesitarán permiso especial.

---

# 21. Cuenta corriente

Si una venta es a cuenta corriente:

```text
Venta
↓
Stock disminuye
↓
NO entra dinero todavía
```

No se debe registrar un cobro hasta que el cliente efectivamente pague.

Cuando posteriormente paga:

```text
Pago
↓
entra dinero
↓
se registra Payment
↓
se relaciona con la deuda/venta correspondiente
```

---

# 22. Presupuestos

Un presupuesto NO es una venta.

Cuando se crea un presupuesto:

```text
NO baja stock
NO entra dinero
NO afecta caja
NO aumenta ventas
```

Queda guardado en el historial.

Después puede convertirse/cargarse como venta cuando el cliente finalmente compra.

Esto permite reutilizar presupuestos anteriores.

---

# 23. Payment

Decisión importante:

Una venta puede tener **uno o varios pagos**.

Ejemplo:

```text
VENTA #1523
Total: $50.000

Efectivo:       $20.000
Transferencia:  $15.000
Posnet:         $15.000
```

`Payment` NO debe guardar los productos.

Los productos pertenecen a `SaleItem`.

`Payment` solamente necesita información relacionada con el cobro:

```text
id
method
amount
createdAt
```

y la relación correspondiente con la operación.

Métodos previstos:

```text
CASH
TRANSFER
CARD
QR
OTHER
```

La lista puede crecer.

---

# 24. Caja

La caja representa un período de trabajo.

Ejemplo:

```text
Caja #128
18/08/2026

Apertura: $100.000
```

Durante el día:

```text
Ventas efectivo: +$350.000
Gastos:          -$40.000
Retiro:          -$100.000
```

Cierre esperado:

```text
$310.000
```

El usuario cuenta físicamente:

```text
$309.500
```

Stockizi muestra:

```text
Diferencia: -$500
```

---

# 25. CashRegister

Conceptualmente:

```text
CashRegister
------------
id
date
openingAmount
expectedAmount
closingAmount
status
openedAt
closedAt
userId
```

Importante:

* `openingAmount`: dinero con el que comenzó.
* `expectedAmount`: dinero que Stockizi calcula.
* `closingAmount`: dinero contado físicamente.
* La diferencia permite detectar errores.

---

# 26. CashMovement

Todo movimiento de caja debe poder quedar registrado.

Ejemplo de ingreso:

```text
Tipo: INGRESO
Concepto: Venta #1523
Medio: Efectivo
Monto: $20.000
```

Ejemplo de egreso:

```text
Tipo: EGRESO
Concepto: Pago proveedor
Medio: Efectivo
Monto: $50.000
```

Otros movimientos:

* Gastos.
* Pagos a proveedores.
* Retiros.
* Reservas.
* Ingresos manuales.
* Ajustes.

---

# 27. Diferencia entre ventas y caja física

Es muy importante no mezclar:

```text
DINERO DE LAS VENTAS
```

con:

```text
DINERO FÍSICO EN LA CAJA
```

Ejemplo:

```text
Ventas del día: $820.000

Efectivo:       $350.000
Transferencias: $280.000
Posnet:         $190.000
```

La transferencia y el Posnet son ingresos, pero no necesariamente representan billetes dentro de la caja.

---

# 28. Resumen diario

Al cerrar la caja queremos mostrar algo como:

```text
RESUMEN DEL DÍA

VENTAS
----------------
Efectivo       $350.000
Transferencia  $280.000
Posnet         $190.000

Total          $820.000

CAJA FÍSICA
----------------
Inicial        $100.000
Ingresos       $350.000
Egresos        $140.000

Esperado       $310.000
Real           $309.500

Diferencia       -$500
```

---

# 29. Gastos

Queremos registrar gastos como:

* Luz.
* Gas.
* Proveedores.
* Otros gastos del negocio.

Los gastos podrán consultarse desde PC y también desde el celular.

Los gastos deben afectar correctamente la caja/dinero cuando corresponda, pero también deben distinguirse de retiros o reservas.

---

# 30. Retiro / dinero para reposición

El usuario suele separar dinero para:

* Restock.
* Inversión.
* Reposición de mercadería.

Esto NO necesariamente es un gasto.

Ejemplo:

```text
Caja: $500.000

Se separan $200.000 para reposición.
```

Conceptualmente queremos poder mostrar:

```text
Caja física:              $300.000
Reservado para reposición: $200.000

Dinero total:             $500.000
```

La reserva no debe falsear las estadísticas de ganancias.

---

# 31. Estadísticas

Cuando se hace una venta:

```text
ventas ↑
ingresos ↑
productos vendidos ↑
```

Pero las estadísticas deben diferenciar correctamente:

* Ventas.
* Cobros.
* Efectivo.
* Transferencias.
* Posnet.
* Cuenta corriente.
* Gastos.
* Rentabilidad.

---

# 32. ARCA / Posnet

El usuario quiere poder controlar las ventas realizadas mediante Posnet y luego pasarlas a ARCA.

Para `Payment` solamente interesa:

```text
monto
método
fecha
```

No hace falta guardar nuevamente qué producto se vendió dentro del pago.

La parte específica de integración con ARCA se diseñará más adelante.

---

# 33. Multi-PC

Actualmente el negocio utiliza una computadora. Stockizi debe permitir trabajar con dos o tres computadoras y acceso administrativo desde el celular, compartiendo la misma información.

La idea final es:

```text
PC 1 ─────┐
          │
PC 2 ─────┼──── API ──── PostgreSQL
          │
PC 3 ─────┤
          │
Celular ──┘
```

Todos trabajan con la misma información.

Esto significa que NO queremos que cada PC tenga su propia base de datos independiente.

---

# 34. Seguridad / usuarios

Más adelante probablemente tendremos:

```text
User
----
id
name
username/email
passwordHash
role
active
```

Roles posibles:

```text
ADMIN
EMPLOYEE
```

Pero esto todavía no está implementado.

---

# 35. Flujo completo esperado

A futuro, el circuito principal será:

```text
                ┌──────────────┐
                │   SUPPLIER   │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │   PURCHASE   │
                └──────┬───────┘
                       │
                       ▼
                    STOCK ↑
                       │
                       │
PRODUCT ────────────────┤
   │                   │
   │                   ▼
   │                 SALE
   │                   │
   │                   ▼
   │                PAYMENT
   │                   │
   │                   ▼
   │              CASH REGISTER
   │
   └── precio/costo/markup
```

---

# 36. Objetivo de aprendizaje

El usuario tiene una base y quiere aprender programación mientras construimos el proyecto, priorizando una aplicación útil para el negocio. No es necesario que pueda escribir cada función desde cero para que el proyecto avance.

Los conceptos se explicarán sobre el código real cuando aparezcan, con profundidad proporcional a lo que necesite comprender:

* Variables.
* Funciones.
* Objetos.
* Arrays.
* Tipos.
* Interfaces/types de TypeScript.
* Módulos.
* Imports/exports.
* Eventos.
* Componentes React.
* Estado.
* Props.
* API.
* HTTP.
* Base de datos.
* SQL.
* Relaciones.
* CRUD.
* Backend/frontend.
* Electron.
* Seguridad.
* Autenticación.

Se calibrará lo que ya conoce para evitar repetir fundamentos innecesariamente. Los ejercicios y cambios pequeños se utilizarán cuando ayuden, sin convertir cada paso en una clase larga. La dinámica concreta se mantiene en [DESARROLLO.md](DESARROLLO.md).

---

# 37. Punto exacto donde quedamos

Ya tenemos el proyecto inicial funcionando con Electron y el código se guarda en un repositorio Git/GitHub.

La carpeta real es:

```text
C:\Users\ezema\Desktop\stockizi
```

Archivos existentes:

```text
.gitignore
DESARROLLO.md
apuntes/              ignorado para nuevos archivos locales
tests/renderer.test.cjs
index.html
main.js
navigation.js
package-lock.json
package.json
readme.md
renderer.js
styles.css
stockizi.md
node_modules/         instalado localmente e ignorado por Git
```

Electron ya está instalado.

Estado funcional actual:

* Rubros conectados: migración 005, GET/POST de categories, POST de subcategories y PATCH de sus nombres. Administrar rubros permite nombres propios y editables. El producto guarda categoryId/subcategoryId opcionales con comprobación de concurrencia; precios/stock se conservan al cambiar solo la clasificación. La API sigue aceptando las peticiones anteriores sin clasificación.
* El usuario confirmó que rubros/subcategorías funcionan en su base habitual; no repetir 005. La siguiente migración es 006 para códigos.
* Verificación más reciente: 62 pruebas automáticas aprobadas y recorrido completo en Electron/PostgreSQL temporal. Además de alta, precios y rubros, se probaron múltiples códigos, ceros iniciales, unicidad con ocho solicitudes concurrentes, rechazo de código ajeno, retiro confirmado, conservación de stock, permisos, borrador protegido y búsqueda fuera de la primera página. Se revisó la ventana. 006 sigue pendiente en stockizi_dev del usuario; no se modificaron sus productos ni credenciales.
* `codes-ui.js` maneja el diálogo y la búsqueda; `server/codes.js` consulta PostgreSQL con parámetros. El puente permite solo listar/agregar/quitar/buscar códigos mediante rutas locales fijas. En ventanas bajas se permite desplazamiento de la página para mantener una altura útil de lista, sin comprimirla a una sola línea.

* `catalog.js` consulta y guarda mediante el puente aislado de Electron. El proceso principal solo permite esas operaciones desde el archivo local y el marco principal de la ventana.
* La lista inicia vacía, muestra carga/error/éxito y no vuelve a productos de ejemplo si falla la API. Actualizar consulta nuevamente; si falla conserva los datos anteriores con advertencia explícita.
* Búsqueda por nombre entre los registros cargados, IDs visibles para distinguir nombres repetidos, selección de ficha y Cargar más para las páginas siguientes. Actualizar reinicia la paginación y conserva la selección si el producto sigue cargado.
* Edición de nombre, costo y venta conectada a `PATCH /api/products/:id`, con permisos y guardado real confirmados por el usuario. El porcentaje se calcula al editar y al guardar; abrir una ficha no corrige datos automáticamente. Guardar exige cambios válidos y respuesta exitosa de la API antes de cambiar el catálogo. Cancelar restaura el borrador; cambiar de producto o actualizar con cambios pendientes se bloquea hasta guardar o cancelar. Un error conserva el formulario. La comparación de nombre/costo/venta originales en el UPDATE evita sobrescribir cambios simultáneos en esos campos (409). No es una auditoría ni un historial de versiones.
* Nuevo producto habilita stock inicial y unidad solamente durante el alta. Guarda producto y movimiento INITIAL (incluso cero) juntos mediante un trigger, sin pedir proveedor ni computadora. Registra fecha, producto, cantidad, unidad y saldo resultante. La aprobación del usuario fue registrada el 15/09/2026. No se inventa historial de productos anteriores. Compras, ventas, ajustes, identidad del empleado y pantalla de movimientos siguen pendientes.
* Actualización posterior: el usuario confirmó que Nuevo producto funcionó y el artículo aparece en GET /api/products de su base. Ya no necesita repetir 004. La comprobación manual del movimiento por SQL aún no fue confirmada. El porcentaje editable está implementado según sección 9: pasaron 49 pruebas y la integración Electron/API/PostgreSQL temporal, con alta por porcentaje, cambio de costo que conserva venta, edición por porcentaje y reconsulta. No se modificaron datos habituales ni credenciales.
* La migración `004_initial_stock.sql` ya fue aplicada por el usuario, quien confirmó el alta. Concede INSERT limitado; no concede UPDATE de stock/unidad ni escritura directa del historial. `stockizi_reader` permanece de solo lectura. La API valida stock inicial no negativo (hasta doce enteros/tres decimales), UNIT entero y otras unidades fraccionarias; no se redondea lo inválido.
* El alta usa POST con una clave única por borrador. Repetir esa clave con los mismos datos recupera el producto sin duplicarlo; con otros datos responde 409. La clave no sobrevive a cancelar/cerrar/recargar: ante un alta incierta se debe reintentar el mismo borrador o consultar antes de crear otro. La navegación conserva el borrador. Nuevo y Actualizar no descartan cambios pendientes.
* Pruebas del alta: 46 pruebas automáticas aprobadas, más PostgreSQL real temporal con las migraciones 001–004, permisos restringidos, rollback forzado del movimiento, cantidades cero/decimales y ocho solicitudes concurrentes sin duplicados. La edición existente sigue funcionando. No se ejecutó 004 ni se modificaron productos en la base habitual del usuario.
* También pasó la prueba completa Electron → IPC → API → PostgreSQL temporal: alta de 1,2 kg, movimiento inicial y reconsulta. Captura revisada, sin errores de JavaScript. Se corrigió un error previo del catálogo: ORDER BY ahora usa el ID numérico de la tabla, no el alias convertido a texto que ordenaba 1, 11, 2. La prueba incluye IDs de uno y dos dígitos.
* Verificación de esta edición: 39 pruebas automáticas aprobadas y prueba completa Electron → IPC → API con base simulada: bloqueo bajo costo, porcentaje 55,74 % para costo 1220 y venta 1900, guardado y reconsulta, stock protegido. Captura revisada. El 15/09/2026 el usuario confirmó `COMMIT` de `003`, configuró su conexión y comprobó que el precio guardado se conserva al usar Actualizar. La confirmación del guardado real proviene del usuario; el asistente no modificó sus productos. Durante el diagnóstico se comprobó configuración y permisos sin mostrar contraseñas.
* El 14/09/2026 pasaron 30 pruebas automáticas (incluidas las del prototipo anterior). Una prueba de integración abrió Electron con la API existente, mostró 4 productos reales de desarrollo, verificó búsqueda, selección, Actualizar, controles de solo lectura y puente limitado sin acceso a Node. Se revisó la captura de esa ventana. No se modificaron productos ni se leyó `.env`.

Prototipo anterior de edición local (conservado en `renderer.js`, NO activo en `index.html`):

* La ventana de escritorio abre correctamente con `npm start`.
* El CSS está separado de `index.html` en `styles.css`.
* `renderer.js` controla la interacción de la interfaz.
* El catálogo permite filtrar por nombre y rubro, muestra la cantidad de resultados y permite limpiar filtros. Agregar un producto limpia los filtros para que se vea la nueva carga. La búsqueda visual con fotos y los múltiples códigos todavía están pendientes.
* La navegación lateral cambia la sección visible sin recrear el formulario ni perder productos durante la sesión. `navigation.js` se encarga de ese comportamiento.
* Existe un formulario provisional para agregar y editar productos con nombre, costo, markup, precio de venta, stock y unidad de medida.
* Seleccionar un producto carga sus datos en el formulario inferior y destaca la fila. Los identificadores estables evitan confundir productos cuando se filtra la lista.
* Los campos son un borrador: el catálogo solo cambia al guardar. Guardar se habilita con cambios válidos y actualiza el mismo producto sin duplicarlo; cargar el formulario no recalcula su precio manual.
* Cancelar restaura los datos guardados del producto seleccionado (o limpia una carga nueva). Nuevo producto inicia un formulario vacío. Si hay cambios pendientes, cambiar de producto, cancelar o iniciar otro pide confirmar el descarte; Seguir editando o Escape conserva el borrador.
* La navegación entre secciones conserva también el borrador. Todavía no hay protección frente al cierre/recarga ni persistencia: este flujo solo debe usarse con datos de prueba.
* Los productos se guardan temporalmente en un array y se muestran en una lista.
* El precio sugerido se calcula desde costo y markup; el precio de venta sigue siendo editable y se guarda su valor actual.
* Cambiar costo o markup vuelve a calcular el precio, por lo que todavía puede sobrescribir una edición manual previa.
* Editar la venta actualiza el porcentaje sobre costo con dos decimales, conservando el precio escrito. Cambiar posteriormente el costo o el porcentaje vuelve a aplicar el cálculo hacia adelante.
* El campo de stock cambia entre `step="1"` para unidades y `step="0.001"` para peso, longitud o volumen.
* La validación JavaScript rechaza unidades fraccionarias, números inválidos, valores iniciales negativos y unidades desconocidas.
* Los errores de la validación JavaScript se muestran dentro del formulario y no se guardan productos inválidos.
* `npm test` pasa 15 pruebas de cálculo, validación, selección, edición sin duplicados, descarte/cancelación, filtros e identificadores y conservación de precios. El 14/09/2026 también se verificó el flujo en Chrome automatizado, sin errores JavaScript, y se revisaron capturas en 1100 × 750 y 390 × 844. Esto no sustituye una prueba manual en Electron.
* Los precios se muestran con formato de pesos argentinos.
* Las unidades usan códigos internos (`UNIT`, `KILOGRAM`, `METER`, `LITER`) y etiquetas visibles (`un.`, `kg`, `m`, `l`).
* Los productos temporales se pierden al cerrar la aplicación porque todavía no existe persistencia.
* Ya se practicó un flujo completo de rama, commit, push, Pull Request, merge y pull.

Trabajo en curso:

* PostgreSQL fue instalado y el usuario confirmó la conexión desde pgAdmin. La consulta `current_database()` confirmó que la base de desarrollo se llama `stockizi_dev`; se corrigió el nombre anterior `stockizi` en el SQL de permisos y la configuración de ejemplo.
* `database/001_create_products.sql` prepara la primera tabla real de productos. Incluye identidad, nombre, costo, venta, porcentaje opcional, unidad, stock, estado activo y fecha de creación. Todavía faltan relaciones, auditoría y conexión a la API; no sustituye el modelo completo de la sección 8.
* El stock SQL usa `NUMERIC` con validación de hasta tres decimales e integridad para `UNIT`, en lugar de redondear automáticamente cantidades antes de validarlas. Se permiten negativos. Los importes usan `NUMERIC(12, 2)` y el porcentaje todavía no se sincroniza automáticamente con el precio.
* El usuario confirmó en pgAdmin `public.products` en su base `stockizi_dev` y ejecutó consultas, INSERT y UPDATE de prueba. No repetir `001`, `002` ni `003`: ya fueron aplicadas. El usuario confirmó también la edición y reconsulta desde Electron con el rol editor.
* Primera API local preparada en `server/`: HTTP nativo de Node y `pg`, con `GET /api/products`, paginación de 100 registros, SQL parametrizado y decimales/IDs conservados como texto en JSON. Es un paso didáctico inicial, no la elección definitiva del framework/ORM.
* `npm run api` carga `.env` (privado e ignorado por Git), comprueba la tabla y escucha únicamente en `127.0.0.1`. El usuario confirmó `002`, configuró sus credenciales y obtuvo los productos; también se comprobó la consulta desde Electron. No hay autenticación de usuarios ni acceso desde otros equipos. Guía: `server/README.md`.

```text
Rama: feature/productos-iniciales
```

Próximo paso recomendado:

* Mejora visual solicitada: hacer la interfaz más cuidada tomando como referencia las capturas y videos de StockFácil ya revisados, conservando catálogo arriba y formulario accesible. Queda planificada; no se rediseñó en este cambio de precios.
* Regla actual de precios comprobada con 49 pruebas y Electron/PostgreSQL temporal: costo conserva porcentaje y actualiza venta. Esta decisión reemplaza la regla anterior que conservaba la venta al cambiar el costo.

* Revisar el recorrido `catalog.js` → `preload.js` → `main.js` → API → PostgreSQL con el usuario.
* Aplicar 004 con el usuario en Query Tool de stockizi_dev, reiniciar API/Electron y comprobar Nuevo producto junto con su movimiento Stock inicial. No repetir 001–003 ni cambiar credenciales. Enseñar INSERT y el trigger automático; revisar el historial con la consulta de database/README.md.
* Activar 006 con el usuario y probar dos códigos sobre un mismo producto, búsqueda por ambos y rechazo de duplicados en otro producto. No repetir 001–005. Después evaluar la base del selector de productos para Nueva venta. El rediseño visual sigue planificado como etapa posterior.
* Definir una acción clara para recalcular el precio sin sobrescribir accidentalmente una edición manual.
* Revisar visualmente la navegación inicial y continuar con las funciones de Productos previstas en el alcance.
* Preparar la migración didáctica a React y TypeScript sin perder lo aprendido.

React y TypeScript todavía no están implementados. La lectura y edición local están comprobadas. El alta con movimiento inicial está implementada y probada en PostgreSQL aislado, pendiente de activar con 004 en la base del usuario. Autenticación y despliegue compartido siguen pendientes.

NO volver a instalar Electron si ya está instalado.

NO crear otro proyecto desde cero sin evaluar primero el estado y la arquitectura existentes.

---

# 38. Uso del documento maestro

Este README es el documento maestro y el prototipo funcional de Stockizi. Su objetivo es conservar el contexto del proyecto para poder retomarlo, revisarlo y mejorarlo sin depender de la memoria de una conversación.

Debe diferenciar claramente:

```text
IMPLEMENTADO   → existe y fue comprobado en el programa
EN CURSO       → se está desarrollando actualmente
PLANIFICADO    → fue acordado, pero todavía no está implementado
POR DECIDIR    → necesita una decisión antes de desarrollarse
```

El documento es vivo: puede modificarse cuando cambie una decisión, se encuentre una solución mejor, se agregue o descarte una función o el código avance.

Reglas para mantenerlo útil:

* Registrar decisiones importantes y explicar su motivo.
* Mantener actualizado el punto exacto del desarrollo.
* No presentar una función planificada como si ya existiera.
* Revisar el impacto de una decisión en PC, celular, API y base de datos.
* Evitar convertirlo en una copia completa del código.
* Conservar los conceptos centrales del negocio aunque cambien las tecnologías.
* Evaluar en conjunto las decisiones que afecten la arquitectura, los datos o el funcionamiento real del negocio.

Las instrucciones didácticas pertenecen a la dinámica de aprendizaje y no deben mezclarse con la especificación funcional, salvo el objetivo general de aprender programación mientras se construye Stockizi.

---

# 39. Nombre oficial

El programa se llama:

**STOCKIZI**

Ese nombre debe utilizarse en el proyecto, interfaz y documentación.

---

# 40. Decisiones pendientes

Estas decisiones afectan la arquitectura o los datos y deben evaluarse antes de implementar las áreas correspondientes.

## 40.1. Producto y stock

* Definir si un producto puede tener un solo distribuidor o varios distribuidores con costos y códigos diferentes.
* Definir el orden exacto entre cálculo, redondeo configurable y corrección manual del precio de venta.
* Definir si el margen se guarda o se calcula para cada consulta y reporte.
* Diseñar un historial de movimientos de stock para poder auditar entradas, ventas, ajustes y pérdidas.
* Definir si habrá un único depósito/local o stock separado por ubicación en el futuro.

## 40.2. Backend y datos

* Elegir el framework del backend/API.
* Confirmar si se utilizará Prisma para trabajar con PostgreSQL.
* Elegir dónde se alojarán la API, PostgreSQL y las fotos.
* Definir copias de seguridad, restauración y conservación del historial.
* Definir el comportamiento cuando una PC pierda temporalmente la conexión.

## 40.3. Operaciones comerciales

* Definir si Stockizi reemplazará o complementará StockFácil y cómo será la transición.
* Confirmar el alcance operativo indispensable y los escenarios de aceptación antes de poner Stockizi en uso.
* Contrastar el Excel de ejemplo ya inspeccionado (sección 5.4) con la exportación completa del negocio y acordar correspondencias, unidades, duplicados y normalización de cantidades.
* Definir el alcance de importación de productos; el ejemplo incluye stock y precios, pero la exportación de deudas e historial sigue sin confirmar.
* Precisar cómo se relacionan los pagos con ventas, compras y cobros de cuenta corriente.
* Definir las reglas exactas para pagos parciales y deudas futuras con proveedores.
* Definir cómo se corrige una venta sin perder la auditoría de la operación original.
* Diseñar la integración o exportación necesaria para Posnet/ARCA.

## 40.4. Acceso y comunicación

* Definir autenticación, permisos y recuperación de acceso.
* Definir permisos para vender con stock insuficiente y modificar manualmente precios durante una venta.
* Elegir la tecnología de notificaciones para recordatorios móviles.
* Definir límites, formatos, compresión y privacidad de las fotos.

Estas cuestiones figuran como `POR DECIDIR`; no deben asumirse como implementadas ni resolverse de manera accidental durante una pantalla provisional.

---

# 41. Ideas futuras

Estas ideas pueden aportar valor cuando el negocio o el sistema crezcan, pero quedan fuera del alcance actual para evitar complejidad prematura.

## 41.1. Variantes con stock propio

Permitir que un producto comparta nombre y precio general, pero tenga variantes con stock separado.

Ejemplo:

```text
Caja organizadora mediana
├── Verde    → 5 unidades
├── Azul     → 8 unidades
└── Celeste  → 7 unidades
```

Una estructura futura podría ser:

```text
Product
   ↓
ProductVariant
--------------
id
productId
name o attributes
stock
active
```

Los códigos de barras podrían asociarse a una variante concreta. Antes de implementarlo habrá que decidir si el precio también puede variar por color o presentación.

## 41.2. Conversión de bultos en compras

Permitir registrar la presentación de compra y convertirla automáticamente a la unidad base de stock.

Ejemplos:

```text
2 bultos × 12 unidades = 24 UNIT
3 bolsas × 25 kg       = 75 KILOGRAM
```

Hasta que esta función sea necesaria, el usuario cargará directamente `24 UNIT` o `75 KILOGRAM` en la compra.
