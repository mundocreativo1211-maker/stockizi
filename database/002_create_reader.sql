-- Ejecutar UNA VEZ como administrador desde Query Tool en la base stockizi_dev.
-- Crea un usuario nuevo sin contraseña; todavía no permite login con contraseña.
-- Si ya existe, ejecutar ROLLBACK; y revisar sus permisos antes de continuar.
BEGIN;
CREATE ROLE stockizi_reader LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
  NOREPLICATION NOBYPASSRLS;
GRANT CONNECT ON DATABASE stockizi_dev TO stockizi_reader;
GRANT USAGE ON SCHEMA public TO stockizi_reader;
GRANT SELECT ON TABLE public.products TO stockizi_reader;
COMMIT;

-- Luego asignar una contraseña desde Propiedades del rol en pgAdmin.
-- NO escribir ni guardar contraseñas en este archivo.
-- No se otorgan INSERT, UPDATE, DELETE ni permisos para crear tablas.
