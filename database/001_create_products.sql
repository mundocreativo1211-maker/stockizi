-- Stockizi: primera parte del modelo real de productos.
-- Ejecutar el archivo completo UNA VEZ en la base de desarrollo.
-- No ejecutarlo sobre la base del negocio ni sobre la tabla productos_practica.
-- Antes: SELECT current_database(); debe mostrar tu base de desarrollo.

-- BEGIN y COMMIT agrupan la creación: si falla, no se aplica parcialmente.
BEGIN;

CREATE TABLE public.products (
  -- Identificador interno automático. NO es el código de barras.
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- NOT NULL impide datos ausentes; CHECK también rechaza texto vacío.
  name TEXT NOT NULL CHECK (btrim(name) <> ''),

  -- NUMERIC guarda decimales exactos. Los importes tienen dos decimales.
  cost_price NUMERIC(12, 2) NOT NULL
    CHECK (cost_price >= 0 AND cost_price <> 'NaN'::NUMERIC),
  sale_price NUMERIC(12, 2) NOT NULL
    CHECK (sale_price >= 0 AND sale_price <> 'NaN'::NUMERIC),

  -- Porcentaje sobre costo, no margen de ganancia.
  -- Puede faltar (NULL): con costo cero no siempre puede calcularse.
  -- La futura API mantendrá su relación con costo y precio manual.
  markup_percentage NUMERIC(12, 2)
    CHECK (markup_percentage >= 0 AND markup_percentage <> 'NaN'::NUMERIC),

  unit TEXT NOT NULL DEFAULT 'UNIT'
    CHECK (unit IN ('UNIT', 'KILOGRAM', 'METER', 'LITER')),

  -- Sin escala fija: primero validamos, en vez de redondear lo ingresado.
  -- Se permite stock negativo porque una venta no debe bloquearse por falta de stock.
  stock NUMERIC NOT NULL DEFAULT 0,
  CONSTRAINT products_stock_finite CHECK (
    stock > '-Infinity'::NUMERIC AND stock < 'Infinity'::NUMERIC
  ),
  CONSTRAINT products_stock_precision CHECK (stock = round(stock, 3)),
  CONSTRAINT products_whole_units CHECK (unit <> 'UNIT' OR stock = trunc(stock)),

  -- Desactivar conserva el producto y permitirá conservar su historial.
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;

-- Si ya existe products, NO la borres para repetir el archivo.
-- Ante un error, ejecutar ROLLBACK; y revisar el mensaje antes de continuar.
