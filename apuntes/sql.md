# Machete de SQL

SQL permite crear, consultar y modificar datos en una base de datos relacional.

## Conceptos

- **Base de datos:** conjunto organizado de información.
- **Tabla:** conjunto de datos del mismo tipo, por ejemplo productos.
- **Fila:** un registro, por ejemplo un producto.
- **Columna:** una propiedad, por ejemplo nombre o precio.
- **Clave primaria:** identificador único.
- **Clave foránea:** referencia a otra tabla.

## Crear una tabla

Ejemplo para PostgreSQL:

```sql
CREATE TABLE products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  cost_price NUMERIC(12, 2) NOT NULL,
  sale_price NUMERIC(12, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Insertar

```sql
INSERT INTO products (name, cost_price, sale_price, stock)
VALUES ('Martillo', 5000, 7500, 10);
```

## Consultar

```sql
SELECT * FROM products;

SELECT name, sale_price
FROM products
WHERE active = TRUE
ORDER BY name ASC;
```

## Actualizar

```sql
UPDATE products
SET sale_price = 8000
WHERE id = 1;
```

No ejecutar un `UPDATE` sin `WHERE` salvo que realmente se quieran modificar todas las filas.

## Eliminar

```sql
DELETE FROM products
WHERE id = 1;
```

En Stockizi probablemente desactivaremos muchos registros en lugar de eliminarlos:

```sql
UPDATE products
SET active = FALSE
WHERE id = 1;
```

## Filtros

```sql
WHERE stock = 0
WHERE stock < 5
WHERE sale_price BETWEEN 1000 AND 5000
WHERE name LIKE '%martillo%'
WHERE supplier_id IN (1, 2, 3)
```

En PostgreSQL, `ILIKE` permite buscar texto sin distinguir mayúsculas:

```sql
SELECT * FROM products
WHERE name ILIKE '%martillo%';
```

## Relaciones y JOIN

```sql
SELECT
  products.name AS product,
  suppliers.name AS supplier
FROM products
JOIN suppliers ON suppliers.id = products.supplier_id;
```

## Agrupar

```sql
SELECT supplier_id, COUNT(*) AS product_count
FROM products
GROUP BY supplier_id;
```

Funciones frecuentes: `COUNT`, `SUM`, `AVG`, `MIN` y `MAX`.

## Transacciones

Permiten confirmar varias operaciones juntas o deshacerlas si algo falla.

```sql
BEGIN;

UPDATE products SET stock = stock - 1 WHERE id = 1;
INSERT INTO sales (total) VALUES (7500);

COMMIT;
```

Para deshacer antes de confirmar:

```sql
ROLLBACK;
```

## Comentarios

```sql
-- Comentario de una línea
```

