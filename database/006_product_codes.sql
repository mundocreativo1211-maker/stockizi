-- Ejecutar UNA vez como administrador en stockizi_dev, después de 005.
-- No modifica productos, precios, stock ni movimientos existentes.
BEGIN;
CREATE TABLE public.product_codes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.products(id),
  code TEXT COLLATE "C" NOT NULL
    CHECK (char_length(code) BETWEEN 1 AND 100 AND code = btrim(code)
           AND code !~ '[[:cntrl:]]'),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Un código activo identifica un solo producto. Quitar conserva el registro.
CREATE UNIQUE INDEX product_codes_active_unique ON public.product_codes(code) WHERE active;
CREATE INDEX product_codes_product_idx ON public.product_codes(product_id);
GRANT SELECT ON public.product_codes TO stockizi_reader, stockizi_editor;
GRANT INSERT (product_id, code), UPDATE (active) ON public.product_codes TO stockizi_editor;
COMMIT;
