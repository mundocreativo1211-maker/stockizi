# Base de datos de Stockizi

## Estado actual: precio estrictamente mayor al costo (007 confirmada)

Confirmación del usuario registrada el 17/09/2026: COMMIT de 007, controles sin filas inválidas y funcionamiento correcto. No repetir 001–007 en stockizi_dev. El asistente no abrió esa conexión. Los pasos siguientes se conservan para instalaciones donde 007 aún no esté aplicada.

La pantalla y la API ya rechazan precios iguales o menores al costo. Antes de activar la restricción en PostgreSQL, abrir `check_product_prices.sql` en Query Tool de stockizi_dev y ejecutar: solo consulta, incluidos productos inactivos. Si devuelve filas, decidir sus precios y corregir explícitamente desde la ficha; no se aumentan ni eliminan automáticamente. Con costo cero la venta debe ser positiva.

Cuando no queden filas inválidas, ejecutar UNA vez `007_sale_above_cost.sql` como administrador. No repetir 001–006 ni editar migraciones aplicadas. 007 valida la tabla y reemplaza el CHECK anterior en una transacción; si falla, ejecutar `ROLLBACK;` y revisar el error. Mantiene datos, stock y permisos. Probada en PostgreSQL temporal con igualdad preexistente (fallo sin cambios), reparación por API y bloqueo SQL posterior. Aplicación habitual confirmada por el usuario.

Las instrucciones inferiores conservan etapas previas; la igualdad permitida de 003 deja de ser la regla vigente cuando se aplica 007.

Estos archivos son parte del programa, no ejercicios descartables. Se guardan con Git y describen cómo construir la base de datos. Guardar un archivo no ejecuta su SQL.

## Primer paso: productos

`001_create_products.sql` crea `public.products`, todavía sin rubros, subcategorías, códigos, proveedores ni movimientos de stock. No modifica `productos_practica` ni importa el Excel. La API actual está en `server/`.

Los nombres SQL usan `snake_case`: `cost_price` representa el `costPrice` del JavaScript. La futura API hará esa correspondencia. El ID numérico identifica el registro en la base compartida, no reemplaza sus códigos de barras ni los identificadores temporales de la interfaz automáticamente.

## Cómo ejecutarlo en desarrollo

1. Abrir Query Tool en la base que creaste para Stockizi. El nombre confirmado mediante `current_database()` es `stockizi_dev`. No usar datos reales del negocio.
2. Abrir `database/001_create_products.sql` desde Query Tool, o copiar todo su contenido allí.
3. Ejecutar el archivo completo, sin dejar seleccionada solamente una parte. Se aplica una vez por base.
4. Si aparece un error, ejecutar `ROLLBACK;` para salir de la transacción y revisar el error. No borrar tablas para volver a empezar.
5. En otra consulta, ejecutar `SELECT * FROM public.products;`. Si quedó creada, devolverá sus columnas y ninguna fila.

No contiene INSERT de prueba: repetir un archivo de creación no debe duplicar artículos. Si `products` ya existe, el error es intencional; no usamos `IF NOT EXISTS` para ocultar diferencias entre versiones.

## Reglas y límites de esta primera versión

- Nombre obligatorio y no vacío; el nombre no es un identificador único.
- Costo y precio no negativos, decimales exactos. `NUMERIC(12, 2)` admite diez dígitos enteros y dos decimales; PostgreSQL redondea importes con más decimales. La API deberá validar los importes originales antes de guardarlos.
- El porcentaje es opcional por ahora; no hay un cálculo automático entre porcentaje, costo y venta en esta tabla. La API deberá mantener esa relación, incluido el tratamiento de costo cero, sin modificar precios manuales inesperadamente.
- Stock negativo permitido. Stock finito, con hasta tres decimales significativos; por unidad, solo enteros. Se usa `NUMERIC` más restricciones para rechazar `1.0001` en vez de redondearlo silenciosamente a `1`.
- `created_at` registra el momento de creación. Auditoría, fecha de modificación, permisos y movimientos de stock se incorporarán en siguientes pasos.
- `001` no bloqueaba precios por debajo del costo. La decisión confirmada es impedirlos al guardar la ficha: `003_enable_product_editing.sql` incorpora esa restricción, también aplicada por pantalla y API. No modificar retrospectivamente `001`.

El prefijo `001` ordena el primer cambio de estructura (una migración). Cuando esté aplicado, los cambios posteriores irán en otro archivo numerado con `ALTER TABLE`, en lugar de borrar o recrear tablas con datos. Todavía no hay un ejecutor ni una tabla de control de migraciones.

## Estado

El usuario confirmó en pgAdmin la existencia de `public.products`, consultó sus columnas e hizo INSERT y UPDATE de prueba. Posteriormente confirmó con `current_database()` que la base se llama `stockizi_dev`, no `stockizi`. No repetir `001` ni borrar la tabla para continuar. Esta confirmación proviene del usuario, no de una inspección directa de su conexión.

El usuario confirmó la ejecución de `002_create_reader.sql` y configuró su contraseña localmente. La consulta de la API y la lectura desde Electron fueron comprobadas. El 15/09/2026 confirmó también `COMMIT` de `003`, configuró `stockizi_editor` y comprobó que el precio editado desde Electron se conserva al usar Actualizar. No repetir estas migraciones. Las instrucciones se conservan en `server/README.md` para futuras instalaciones.

## Habilitar edición (ya ejecutado en stockizi_dev)

Abrir `003_enable_product_editing.sql` en Query Tool como administrador, conectado a `stockizi_dev`, y ejecutar una vez el archivo completo. Agrega `CHECK (sale_price >= cost_price)` y crea `stockizi_editor` con lectura y UPDATE de cuatro columnas solamente. No concede INSERT, DELETE ni modificación de stock o unidad. No cambia productos ni sus porcentajes anteriores.

Si algún precio existente incumple la regla, la migración falla sin corregirlo. Ejecutar `ROLLBACK;`, revisar `SELECT id, name, cost_price, sale_price FROM public.products WHERE sale_price < cost_price;` y decidir cómo corregir esos registros antes de repetir. No borrar tablas. Después, asignar contraseña al nuevo rol mediante pgAdmin y configurar `.env` como indica la guía de la API.

Los permisos son por columna, según [GRANT de PostgreSQL](https://www.postgresql.org/docs/18/sql-grant.html). La restricción compara costo y venta según [CHECK de PostgreSQL](https://www.postgresql.org/docs/18/ddl-constraints.html). Los permisos públicos o membresías ajenas a estas migraciones también deben revisarse antes de usar datos reales.

Documentación: [identificadores automáticos](https://www.postgresql.org/docs/18/ddl-identity-columns.html) y [decimales NUMERIC](https://www.postgresql.org/docs/18/datatype-numeric.html).

## Alta y stock inicial: migración 004

El usuario confirmó que creó un producto desde Stockizi y lo vio en la API. No repetir 004 en esa base. La comprobación manual del movimiento con la consulta inferior queda como siguiente paso didáctico. El porcentaje editable agregado después no requiere cambios SQL.

El usuario aprobó cargar existencias al crear un producto y registrar automáticamente su origen como **Stock inicial**. No exige proveedor ni computadora: no es una compra. Fecha, producto, cantidad, unidad y stock resultante quedan en `stock_movements`. La identificación del empleado espera a la autenticación.

Abrir `004_initial_stock.sql` como administrador en `stockizi_dev` y ejecutar completo una vez. Mantener el usuario `stockizi_editor` y su contraseña actual; no cambiar `.env`. Después reiniciar API y Electron. No repetir 001–003. Ante error, ejecutar ROLLBACK y revisar antes de reintentar.

La migración crea `stock_movements`, agrega `creation_key` y `creation_payload` para reconocer reintentos, y concede INSERT limitado en productos. Un trigger AFTER INSERT registra el movimiento en la misma transacción: o quedan ambos registros o ninguno. Incluye inicial cero; no crea filas para productos anteriores, cuyo historial sigue desconocido. El rol editor no recibe UPDATE de stock/unidad, DELETE de productos ni escritura directa en movimientos. La función del trigger tiene permisos acotados a su operación, nombres calificados y search_path fijo; su ejecución pública está revocada.

El stock inicial de la API admite valores no negativos con hasta doce dígitos enteros y tres decimales. UNIT solo acepta enteros; KILOGRAM, METER y LITER admiten fracciones. Esto no elimina la regla de permitir stock negativo por futuras ventas: las ventas y ajustes todavía no están implementados. El historial actual admite INITIAL solamente; futuras migraciones incorporarán los otros motivos y sus reglas.

Para ver lo registrado desde Query Tool (la pantalla de historial sigue pendiente):

```sql
SELECT p.id, p.name, m.created_at, m.kind,
       m.quantity, m.unit, m.stock_after
FROM public.stock_movements AS m
JOIN public.products AS p ON p.id = m.product_id
ORDER BY m.id DESC;
```

Referencia: los [triggers de PostgreSQL](https://www.postgresql.org/docs/18/trigger-definition.html) se ejecutan en la transacción de la operación que los dispara.

## Rubros y subcategorías: 005 (confirmado por el usuario)

En Query Tool de `stockizi_dev`, como administrador, abrir `005_categories.sql` y ejecutar completo una sola vez. Después reiniciar API y Electron; no cambiar `.env`, no crear otro usuario ni repetir 001–004. Ante un error, ejecutar ROLLBACK y revisar antes de repetir.

Se crean `categories` y `subcategories` vacías, con nombres editables de hasta 80 caracteres. Los productos reciben `category_id` y `subcategory_id` opcionales: los existentes quedan sin rubro, sin cambiar precios, stock ni movimientos. Los nombres no se guardan repetidos en productos. Un FK compuesto garantiza que la subcategoría pertenezca al rubro y un CHECK impide subcategoría sin rubro.

Hay unicidad del nombre sin distinguir mayúsculas (incluidas letras acentuadas) dentro de cada rubro/nivel. Se utiliza `pg_unicode_fast`, disponible en PostgreSQL 18 y bases UTF8, para no depender del idioma de Windows. Las tildes sí distinguen nombres. Se mantienen permisos de lectura para reader/editor y se conceden solamente altas y renombrado al editor, además de cambiar los dos vínculos del producto. No hay DELETE ni cambio de padre.

Verificado con migraciones 001–005 en PostgreSQL temporal separado y con la ventana real. Posteriormente el usuario confirmó el funcionamiento de rubros/clasificación en su base; no repetir 005. Referencias: [claves foráneas](https://www.postgresql.org/docs/18/ddl-constraints.html#DDL-CONSTRAINTS-FK) y [comparación Unicode en PostgreSQL 18](https://www.postgresql.org/docs/18/collation.html#COLLATION-MANAGING-STANDARD).

## Múltiples códigos: 006 (pendiente en la base del usuario)

En Query Tool, conectado como administrador a `stockizi_dev`, abrir `006_product_codes.sql` y ejecutar todo una sola vez. No repetir 001–005, no cambiar `.env` ni contraseñas. Ante error, ejecutar `ROLLBACK;` y revisar el primer error antes de reintentar. Luego reiniciar API y Electron.

Crea `product_codes` con ID propio, vínculo `product_id`, código TEXT (1–100 caracteres), `active` y fecha de creación. TEXT conserva ceros iniciales y letras. La comparación exacta distingue mayúsculas y minúsculas. Un índice único parcial sobre códigos activos impide que uno identifique dos productos. El editor puede leer, insertar producto/código y modificar `active`, no borrar filas ni cambiar el producto/código de una asociación. Quitar desde la API desactiva por ID de asociación y producto; un reintento antiguo no elimina una asociación nueva. No modifica precios, stock ni movimientos, ni agrega códigos a productos anteriores.

Pruebas aisladas: ocho altas simultáneas del mismo código/producto, conflicto con otro producto, búsqueda exacta, retiro, reasignación explícita posterior y permisos. La base habitual no se modificó.
