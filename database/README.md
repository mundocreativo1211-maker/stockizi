# Base de datos de Stockizi

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
