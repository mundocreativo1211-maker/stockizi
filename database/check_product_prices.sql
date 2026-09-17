-- Solo consulta: ejecutar primero en Query Tool de stockizi_dev.
-- Incluye inactivos porque la restricción protege toda la tabla.
SELECT current_database() AS base_actual;
SELECT id, name, cost_price, sale_price, active
FROM public.products
WHERE sale_price <= cost_price
ORDER BY id;
-- Si hay filas: revisar cada precio con decisión del usuario.
-- No ejecutar 007 hasta que esta consulta no devuelva productos.
