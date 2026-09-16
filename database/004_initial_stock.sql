-- Ejecutar completo UNA vez como administrador en stockizi_dev, después de 003.
-- No modifica stock ni inventa movimientos para productos preexistentes.
BEGIN;

ALTER TABLE public.products
  ADD COLUMN creation_key UUID UNIQUE,
  ADD COLUMN creation_payload JSONB;

CREATE TABLE public.stock_movements (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.products(id),
  kind TEXT NOT NULL CHECK (kind = 'INITIAL'),
  quantity NUMERIC NOT NULL CHECK (
    quantity >= 0 AND quantity < 'Infinity'::NUMERIC AND quantity = round(quantity, 3)
  ),
  unit TEXT NOT NULL CHECK (unit IN ('UNIT', 'KILOGRAM', 'METER', 'LITER')),
  stock_after NUMERIC NOT NULL CHECK (stock_after = quantity),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (unit <> 'UNIT' OR quantity = trunc(quantity))
);
CREATE UNIQUE INDEX stock_movements_one_initial
  ON public.stock_movements(product_id) WHERE kind = 'INITIAL';

-- Un trigger es una acción automática de la base. Se ejecuta dentro de la
-- MISMA transacción del INSERT: si falla, no se guarda tampoco el producto.
CREATE FUNCTION public.record_initial_stock() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, pg_temp AS $$
BEGIN
  INSERT INTO public.stock_movements (product_id, kind, quantity, unit, stock_after)
  VALUES (NEW.id, 'INITIAL', NEW.stock, NEW.unit, NEW.stock);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.record_initial_stock() FROM PUBLIC;
CREATE TRIGGER products_initial_stock AFTER INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.record_initial_stock();

-- No concedemos UPDATE de stock/unidad ni escritura directa sobre movimientos.
GRANT INSERT (name, cost_price, sale_price, markup_percentage, unit, stock,
              creation_key, creation_payload) ON public.products TO stockizi_editor;
GRANT SELECT ON public.stock_movements TO stockizi_editor, stockizi_reader;

COMMIT;
-- No repetir 001, 002 ni 003. Ante error: ROLLBACK; y revisar, sin borrar tablas.
