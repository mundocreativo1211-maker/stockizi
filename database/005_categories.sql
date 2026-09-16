-- Una vez como administrador en stockizi_dev, después de 004.
-- No agrega nombres predefinidos ni clasifica productos automáticamente.
BEGIN;
CREATE TABLE public.categories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT COLLATE pg_catalog.pg_unicode_fast NOT NULL CHECK (name = btrim(name) AND char_length(name) BETWEEN 1 AND 80)
);
CREATE UNIQUE INDEX categories_name_unique ON public.categories (lower(name));
CREATE TABLE public.subcategories (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES public.categories(id),
  name TEXT COLLATE pg_catalog.pg_unicode_fast NOT NULL CHECK (name = btrim(name) AND char_length(name) BETWEEN 1 AND 80),
  UNIQUE (id, category_id)
);
CREATE UNIQUE INDEX subcategories_name_unique ON public.subcategories (category_id, lower(name));

ALTER TABLE public.products
  ADD COLUMN category_id BIGINT REFERENCES public.categories(id),
  ADD COLUMN subcategory_id BIGINT,
  ADD CONSTRAINT products_subcategory_needs_category
    CHECK (subcategory_id IS NULL OR category_id IS NOT NULL),
  ADD CONSTRAINT products_subcategory_belongs_to_category
    FOREIGN KEY (subcategory_id, category_id) REFERENCES public.subcategories(id, category_id);
CREATE INDEX products_category_idx ON public.products(category_id, subcategory_id);

GRANT SELECT ON public.categories, public.subcategories TO stockizi_reader, stockizi_editor;
GRANT INSERT (name), UPDATE (name) ON public.categories TO stockizi_editor;
GRANT INSERT (name, category_id), UPDATE (name) ON public.subcategories TO stockizi_editor;
GRANT INSERT (category_id, subcategory_id), UPDATE (category_id, subcategory_id)
  ON public.products TO stockizi_editor;
COMMIT;
-- No se conceden DELETE ni traslado de subcategorías. Renombrar conserva el ID.
