# API local de Stockizi: consulta y edición limitada

Esta etapa usa HTTP de Node y `pg` (node-postgres), sin elegir todavía un framework definitivo ni un ORM. Node 22 o posterior permite iniciar el script con `--env-file`. La dependencia `pg` está registrada en `package.json` y su lockfile.

## Recorrido del código

1. `index.js` inicia el programa y comprueba acceso a la tabla.
2. `database.js` lee la configuración privada y prepara conexiones reutilizables (`Pool`).
3. `app.js` recibe `GET /api/products`, `POST /api/products` o `PATCH /api/products/:id`, valida la entrada y prepara JSON.
4. `products.js` ejecuta SELECT, INSERT o UPDATE parametrizados. `pricing.js` valida precios y stock inicial sin cálculos decimales aproximados.

`async` y `await` permiten esperar a PostgreSQL sin bloquear las demás solicitudes. Los alias SQL, por ejemplo `cost_price AS "costPrice"`, producen los nombres que usa nuestro JavaScript.

Electron ahora usa `catalog.js` para consultar esta API. `renderer.js` conserva el prototipo anterior, pero no está cargado por la ventana. No hay ventas, modificaciones de stock, login, importación ni sincronización entre equipos.

## Preparación local (una vez)

1. Confirmar `SELECT current_database();` en pgAdmin: esta guía usa la base de desarrollo `stockizi_dev`.
2. Ejecutar completo `database/002_create_reader.sql` como administrador en esa base. No repetir `001`: el usuario ya confirmó que `products` existe.
3. En pgAdmin, actualizar la lista de Roles de inicio de sesión/grupo (Login/Group Roles), abrir Propiedades de `stockizi_reader` y asignar una contraseña en Definición. Guardarla de forma privada. No escribirla en el SQL, el README ni el chat.
4. Copiar `.env.example` como `.env` en la raíz del proyecto y completar `PGPASSWORD` SOLO en `.env`. Conservar `PGUSER=stockizi_reader`. Si tiene caracteres especiales, envolver el valor entre comillas; no compartir el archivo.
5. `.env` está ignorado por Git. `.env.example` es una plantilla pública sin secretos.

El rol `stockizi_reader` recibe SELECT únicamente y mantiene transacciones de solo lectura. Los permisos públicos preexistentes también pueden influir: esta guía presupone una instalación nueva de desarrollo.

## Activar el guardado (ya confirmado por el usuario en stockizi_dev)

1. En Query Tool, como administrador y conectado a `stockizi_dev`, abrir y ejecutar completo `database/003_enable_product_editing.sql` UNA vez. No repetir `001` ni `002`.
2. Actualizar la lista de roles y asignar contraseña a `stockizi_editor` en Propiedades → Definición, sin compartirla.
3. En tu `.env` existente cambiar `PGUSER=stockizi_editor` y `PGPASSWORD` por esa contraseña. No reemplazar todo el archivo ni subirlo a Git. La plantilla pública `.env.example` fue restaurada sin secretos.
4. Detener la API con Ctrl+C y volver a ejecutar `npm run api`. Cerrar y volver a abrir Stockizi con `npm start` en otra terminal.
5. En un producto de desarrollo, modificar la venta sin bajarla del costo, guardar y usar Actualizar. Comprobar el mismo registro por ID en pgAdmin. No duplicar los INSERT de práctica.

Con 003 el editor puede actualizar solo nombre, costo, venta y porcentaje. La migración 004 agrega INSERT limitado con stock inicial, sin habilitar borrado ni cambios de stock/unidad de productos existentes. La conexión permite escritura solo cuando `PGUSER` es `stockizi_editor`; PostgreSQL aplica además los permisos por columna. El rol anterior conserva su acceso de consulta.

La pantalla y la API impiden guardar venta menor al costo; igualdad permitida. La migración agrega también un CHECK. Si hay datos anteriores que lo incumplen, la migración falla: hacer ROLLBACK y revisar, sin correcciones automáticas. El porcentaje se deriva de los precios, es nulo con costo cero y nunca reemplaza el precio manual.

PATCH recibe `name`, `costPrice`, `salePrice` (importes como texto) y `expected` con los tres valores originales. Rechaza campos adicionales, más de dos decimales, importes fuera de rango y cuerpos mayores a 8 KiB. El UPDATE compara los originales: si cambiaron o el registro ya no existe, responde 409 sin sobrescribirlo. No hay auditoría todavía.

## Ejecutar

Desde la raíz de Stockizi:

```sh
npm run api
```

Abrir en el navegador:

```text
http://127.0.0.1:3000/api/products
```

`5432` es el puerto de PostgreSQL. `3000` es el de esta API. La respuesta será un objeto con `products` y `nextAfterId`. Devuelve hasta 100 registros por página; si hay más, consultar `?afterId=<nextAfterId>` hasta recibir `null`. Se incluyen activos e inactivos.

Los IDs y decimales se devuelven como texto para no perder precisión, por ejemplo `"stock": "1.200"`. No significa que PostgreSQL los guarde como texto. En la integración de la interfaz se decidirá cómo formatearlos sin perder precisión.

Detener con Ctrl+C. `npm start` continúa abriendo Electron por separado.

## Consultar desde la ventana de Stockizi

1. Mantener `npm run api` abierto en una terminal.
2. En otra terminal, ejecutar `npm start`. Si la ventana estaba abierta con la versión anterior, cerrarla y abrirla de nuevo para cargar el nuevo puente.
3. Ir a Productos: consultar fichas, buscar por nombre o apretar Actualizar. La carga trae hasta 100 registros y Cargar más solicita la próxima página. La búsqueda se limita a lo cargado y lo indica cuando quedan páginas.

La ventana no lee `.env`. El proceso principal usa `API_PORT` del entorno o 3000 por defecto. Si cambiaste el puerto de la API, establecer también `$env:API_PORT = '3001'` (con el puerto elegido) en la terminal de PowerShell antes de `npm start`.

`preload.js` expone solo `listProducts`, `saveProduct` y `createProduct`, no SQL, credenciales ni acceso general a Node. `api-client.js` limita las operaciones a rutas de productos en localhost, valida respuestas y conserva números como texto. No se relajaron las restricciones de CORS. Se siguen las [pautas de IPC de Electron](https://www.electronjs.org/docs/latest/tutorial/ipc).

Si falla una consulta, se conservan los datos anteriores con advertencia. Si falla un guardado, se conserva el borrador sin mostrar éxito. Un corte puede ocurrir después de que la base guardó: en ediciones, copiar los cambios y consultar antes de reintentar; en altas, reintentar el mismo formulario sin cambiar sus datos. Con cambios pendientes, Actualizar/cambiar de producto exige guardar o cancelar. Cancelar descarta el borrador. Rubros y cambios posteriores de stock/unidad siguen bloqueados. Cerrar o recargar la ventana todavía puede perder un borrador sin guardar.

## Nuevo producto y movimiento inicial

El usuario ya confirmó un alta desde la ventana visible en la API. No repetir 004 en su base. Se puede escribir el porcentaje para calcular la venta. Por pedido posterior del usuario, cambiar costo ahora conserva el porcentaje disponible y recalcula la venta; cambiar la venta manualmente recalcula el porcentaje. La API no acepta un porcentaje arbitrario: continúa derivándolo de los precios. Con costo cero se ingresa venta directamente. El precio sugerido redondea a centavos y el porcentaje efectivo guardado puede diferir por ese redondeo. La regla nueva pasó las 49 pruebas y la integración Electron/PostgreSQL temporal.

Verificación más reciente: 49 pruebas aprobadas, incluida la validación de porcentaje vacío/negativo/excesivo y conservación de precio manual, y prueba completa con Electron y PostgreSQL temporal. No se requiere nueva migración ni cambio de credenciales.

Requiere ejecutar una vez `database/004_initial_stock.sql` en la base de desarrollo y reiniciar API/Electron. No cambia la contraseña ni los registros anteriores. Desde Nuevo producto se cargan nombre, costo, venta, unidad y stock inicial (cero permitido). El porcentaje se calcula y no puede guardarse venta por debajo del costo. Tras el alta, stock y unidad quedan protegidos nuevamente.

POST recibe exactamente esos cinco campos más `requestId` (UUID v4 generado por la pantalla). El INSERT dispara el movimiento INITIAL dentro de su misma transacción. La API devuelve 201 al crear y 200 al recuperar un alta anterior con la misma clave y datos. La clave UNIQUE evita duplicados también con solicitudes simultáneas; si se reutiliza con datos diferentes responde 409 sin modificar el producto previo. Nombre repetido con una clave nueva sigue permitido: el nombre no es un identificador único.

La clave se conserva durante el borrador actual, no después de cancelar, cerrar o recargar. Ante un alta incierta, reintentar sin cambiar los datos; si se perdió el borrador, consultar el catálogo antes de iniciar otra para no duplicarla. No hay reintentos automáticos. El historial se consulta por SQL según `database/README.md`; aún no hay pantalla de movimientos.

Verificación del alta: `npm test` pasa 46 pruebas. `node scripts/verify-initial-stock.cjs` ejecuta pruebas adicionales con PostgreSQL real en un servidor temporal aislado, sin .env ni puerto 5432: migraciones, permisos, inicial cero, kilos, rechazo de fracciones por unidad, rollback si falla el movimiento, reintentos concurrentes y conservación de productos anteriores. Detiene su servidor al terminar y conserva archivos temporales para diagnóstico. Requiere los binarios de PostgreSQL 18 en Windows; admite `STOCKIZI_TEST_PG_BIN`. `--electron` agrega una prueba de la ventana (requiere Playwright del runtime local o `STOCKIZI_TEST_PLAYWRIGHT`). No ejecutar estas migraciones repetidamente en la base habitual.

La variante `--electron` pasó: alta de 1,2 kg, consulta del movimiento en PostgreSQL y Actualizar desde la ventana; captura revisada. Se corrigió el orden del catálogo para usar `public.products.id` numérico y no el alias `id` convertido a texto. Esto evita ordenar 1, 11, 2 y fallar la validación/paginación al tener identificadores de dos dígitos.

## Errores y límites

- Falta `.env`: copiar la plantilla antes de iniciar.
- No conecta: revisar que PostgreSQL esté iniciado, la base/tabla exista, el rol tenga contraseña y permisos y que los valores privados sean correctos. No enviar la contraseña al pedir ayuda.
- Puerto API ocupado: elegir otro `API_PORT` libre; no cambiar `PGPORT` si PostgreSQL continúa en 5432.
- HTTP 400: entrada inválida; 403: origen/host externo o falta permiso de edición; 404: ruta inexistente; 405: método no admitido; 409: conflicto; 413: cuerpo grande; 415: no es JSON; 503: fallo de consulta o guardado no confirmado.
- No hay autenticación de usuarios todavía. Solo escucha en `127.0.0.1` y no permite CORS externo. No abrir puertos, no usar túneles ni publicar esta versión. Otros procesos de la misma computadora sí pueden consultarla.
- Compartir con otras PCs/celular requiere definir autenticación, autorización, HTTPS, alojamiento y política de conexión; no basta con cambiar la dirección del servidor.

## Verificación

`npm test` pasa 39 pruebas de API, cliente, precios, catálogo conectado y prototipo anterior, sin tocar PostgreSQL. Incluye bloqueo bajo costo, porcentaje exacto, campos protegidos, conflictos, fallos y conservación del borrador. Se probó también Electron → IPC → API con base simulada y captura revisada. La lectura de 4 productos desde PostgreSQL se comprobó en la etapa anterior. El 15/09/2026 el usuario confirmó `COMMIT` de `003` y una edición real que se conserva al usar Actualizar. Durante la configuración se diagnosticaron usuario/base incorrectos sin mostrar contraseñas ni modificar productos. El mensaje de inicio ahora indica revisar el usuario configurado, sin mencionar siempre stockizi_reader.

Documentación: [conexión de node-postgres](https://node-postgres.com/features/connecting) y [pool de conexiones](https://node-postgres.com/features/pooling).

## Rubros persistentes y nombres editables

Esta etapa pasó 55 pruebas automáticas y la prueba completa de Electron/PostgreSQL temporal. Después el usuario confirmó rubros/clasificación en su base habitual: no repetir `005_categories.sql`. No contiene rubros predefinidos y no cambia `.env`.

- `GET /api/categories`: rubros y subcategorías en un mismo snapshot.
- `POST /api/categories`: `{name}`; `POST /api/subcategories`: `{name, categoryId}`.
- `PATCH /api/categories/:id` o `/api/subcategories/:id`: `{name, expectedName}`. Conserva el ID; no permite mover ni borrar.
- POST/PATCH de productos admite opcionalmente el par `categoryId`, `subcategoryId` (IDs como texto o null). En PATCH se incluyen también los dos valores originales dentro de `expected` para detectar conflictos.

Los nombres obligatorios admiten hasta 80 caracteres y se recortan en sus extremos. Nombres repetidos en el mismo nivel/rubro no crean duplicados; un reintento de alta devuelve la entrada existente (200). Un renombrado que pisa otro nombre o parte de datos antiguos devuelve 409. Subcategorías iguales pueden existir bajo rubros diferentes. Los vínculos cruzados se rechazan tanto en API como en PostgreSQL.

`category-ui.js` maneja listas, filtros y el diálogo. El puente expone `listCategories` y `saveCategory` con rutas limitadas. El catálogo no deja abrir el administrador con cambios de producto pendientes. Renombrar actualiza las etiquetas, no los IDs. Si falla la carga de rubros, se muestra el error y se deshabilita esa parte; no se envían vínculos vacíos para sobrescribir datos. Los filtros son locales a los productos cargados, no una consulta global aún. Las listas de rubros se cargan completas; paginar/buscar esas listas queda para volúmenes grandes.

`scripts/check-categories.cjs` amplía la prueba aislada de `scripts/verify-initial-stock.cjs --electron`: comprueba crear/renombrar, conservar relaciones, validación de rubro-padre, nombres acentuados, conflictos, permisos y filtros combinados desde la ventana. Las peticiones de producto anteriores sin clasificación siguen funcionando, incluso antes de aplicar 005.

## Códigos persistentes: estado más reciente

62 pruebas automáticas y prueba completa en PostgreSQL/Electron temporal aprobadas. `006_product_codes.sql` está pendiente en la base habitual. Aplicar una sola vez después de 005 y reiniciar API/Electron; no cambiar `.env`.

- `GET /api/products/:id/codes`: asociaciones activas `{codes: [{id, productId, code}]}`.
- `POST /api/products/:id/codes`: `{code}` de texto; 201 al crear, 200 al repetir sobre el mismo producto, 409 si pertenece a otro. No reasigna automáticamente.
- `DELETE /api/products/:id/codes/:codeId`: desactiva esa asociación; no borra físicamente, ni modifica stock/producto. Repetir el retiro del mismo ID es seguro.
- `GET /api/products/by-code?code=...`: `{product}` o `{product: null}`. Coincidencia exacta en toda la base, sin depender de la página cargada.

Códigos de hasta 100 caracteres, sin controles, conservando letras y ceros. Se recortan extremos y se distinguen mayúsculas/minúsculas. SQL parametrizado e índice único parcial protegen de inyección y duplicados concurrentes. Permisos y origen mantienen los límites locales existentes; esto no habilita acceso remoto ni autenticación.

`scripts/check-codes.cjs` amplía el ensayo aislado: unicidad concurrente, reintentos, código ajeno, retiro/reasignación, permisos y conservación de existencias. Con `--electron` verifica agregar varios códigos, proteger borradores, confirmar retiro y encontrar productos fuera de la primera página. Prueba con lector físico y uso desde Ventas pendientes.
