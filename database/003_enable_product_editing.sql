-- Ejecutar UNA vez como administrador en stockizi_dev, después de 001 y 002.
-- No borra ni corrige productos. Si hay precios menores al costo, hace ROLLBACK
-- al fallar: revisar esos registros antes de intentar nuevamente.
BEGIN;

ALTER TABLE public.products
  ADD CONSTRAINT products_sale_covers_cost CHECK (sale_price >= cost_price);

CREATE ROLE stockizi_editor LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
  NOREPLICATION NOBYPASSRLS;
GRANT CONNECT ON DATABASE stockizi_dev TO stockizi_editor;
GRANT USAGE ON SCHEMA public TO stockizi_editor;
GRANT SELECT ON TABLE public.products TO stockizi_editor;
GRANT UPDATE (name, cost_price, sale_price, markup_percentage)
  ON TABLE public.products TO stockizi_editor;

COMMIT;
-- Asignar contraseña en Propiedades del rol en pgAdmin, nunca en este archivo.
-- Luego cambiar PGUSER y PGPASSWORD en .env y reiniciar npm run api.
-- stockizi_reader sigue siendo solo lectura. No se conceden INSERT ni DELETE.
