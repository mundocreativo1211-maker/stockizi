-- Ejecutar UNA vez como administrador en stockizi_dev, después de 006.
-- Antes ejecutar check_product_prices.sql y revisar las filas encontradas.
-- No aumenta precios, no borra productos y no modifica stock.
BEGIN;
-- Valida toda la tabla. Si existen igualdades, falla sin reemplazar la regla.
ALTER TABLE public.products
  ADD CONSTRAINT products_sale_above_cost CHECK (sale_price > cost_price);
ALTER TABLE public.products DROP CONSTRAINT products_sale_covers_cost;
COMMIT;
-- Ante error: ROLLBACK; y revisar el primer error. No repetir 001–006.
