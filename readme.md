# STOCKIZI — Documento maestro del proyecto

## 1. Objetivo del proyecto

Estamos construyendo **Stockizi**, un programa de escritorio para controlar un negocio real.

El objetivo del usuario NO es solamente obtener el programa terminado: quiere **aprender programación mientras construimos un programa que realmente funcione**.

Por eso el desarrollo debe hacerse de forma didáctica:

* Explicar qué estamos haciendo.
* Explicar para qué sirve cada archivo.
* Explicar los conceptos nuevos.
* Evitar simplemente entregar enormes bloques de código sin explicación.
* Construir el programa progresivamente.
* Probar cada parte antes de avanzar.

La aplicación principal será de **escritorio**, pero tendrá una **interfaz web privada para administrar ciertas cosas desde el celular**.

---

# 2. Arquitectura general prevista

La idea final es:

```text
                         STOCKIZI
                            │
                           API
                            │
                     Base de datos
                       PostgreSQL
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
       🖥️ Aplicación PC              📱 Web móvil
          Electron                     React
```

La PC y el celular deben trabajar con **los mismos datos**.

No queremos una base de datos diferente en cada computadora.

Esto permitirá que:

* Se modifique un precio desde el celular.
* La PC vea el cambio.
* Se agregue un producto desde la PC.
* El celular lo vea.
* Se consulte stock desde el celular.
* Se consulten gastos/caja desde el celular.

---

# 3. Tecnologías previstas

Tecnologías principales:

* Node.js
* npm
* TypeScript
* React
* Electron
* PostgreSQL
* API/backend
* Más adelante posiblemente Prisma para trabajar con la base de datos.

La aplicación de escritorio utilizará Electron.

La interfaz será desarrollada con React/TypeScript.

La base de datos central será PostgreSQL.

---

# 4. Estado actual del proyecto

La carpeta está en:

```text
C:\Users\ezema\Desktop\stockizi
```

Actualmente contiene:

```text
stockizi/
├── node_modules/
├── index.html
├── main.js
├── package-lock.json
├── package.json
└── stockizi.md
```

Node instalado:

```text
Node.js v26.7.0
npm 11.19.0
```

Electron ya fue instalado.

Ya se consiguió ejecutar una primera ventana de Stockizi utilizando Electron.

El usuario vio una ventana tipo launcher que correspondía a la aplicación que habíamos creado.

Todavía es una versión inicial/básica.

---

# 5. Cómo queremos desarrollar

No queremos hacer todo de golpe.

Orden aproximado:

```text
1. Electron / aplicación de escritorio
2. React + TypeScript
3. Interfaz inicial
4. Base de datos
5. Productos
6. Distribuidores
7. Compras
8. Stock
9. Ventas
10. Pagos
11. Caja
12. Presupuestos
13. Gastos
14. Reportes/estadísticas
15. Cuenta corriente
16. Actualización de precios
17. Interfaz móvil
18. Usuarios/permisos
19. Copias de seguridad
20. Empaquetado/instalador
```

El orden puede cambiar si durante el desarrollo encontramos una razón técnica para hacerlo.

---

# 6. Flujo diario del negocio

El usuario describió este flujo real:

```text
Abrir caja
↓
Actualizar precios
↓
Vender productos
↓
Buscar stock/productos
↓
Buscar por nombre o código de barras
↓
Pagar proveedores
↓
Vender por mayor
↓
Pasar ventas de Posnet a ARCA
↓
Cerrar caja
↓
Revisar resumen
↓
Separar dinero para reposición/inversión
↓
Dejar dinero para iniciar la caja del día siguiente
↓
Cargar presupuestos de ventas anteriores que vinieron a pagar
↓
Corregir ventas que fueron cargadas como contado pero realmente fueron transferencia
```

---

# 7. Funciones deseadas

Stockizi debe permitir:

* Cargar productos.
* Editar productos.
* Eliminar/desactivar productos.
* Buscar productos.
* Buscar por nombre.
* Buscar por código de barras.
* Controlar stock.
* Avisar cuando un producto tiene poco stock.
* Mostrar foto del producto.
* Poder ampliar/ver la foto del producto.
* Asociar productos a distribuidores.
* Actualizar precios individualmente.
* Actualizar precios de varios productos.
* Aumentar precios por cantidad fija.
* Aumentar precios por porcentaje.
* Actualizar precios desde el celular.
* Ver productos de un distribuidor.
* Registrar compras.
* Registrar pagos a proveedores.
* Registrar ventas.
* Registrar pagos.
* Manejar ventas en efectivo.
* Manejar transferencias.
* Manejar Posnet/tarjeta.
* Manejar presupuestos.
* Manejar cuenta corriente.
* Controlar caja diaria.
* Registrar gastos.
* Separar dinero para reposición/inversión.
* Ver estadísticas.
* Ver historial.
* Preparar información relacionada con ventas de Posnet para ARCA.
* Tener resumen diario.
* Poder utilizarse en más de una PC.
* Tener administración desde celular.

---

# 8. Producto

Los campos definidos para `Product` son:

```text
name
description
costPrice
markup / salePercentage
salePrice
margin
code
supplierId
wholesaleMinimumQuantity
wholesalePrice
photo
```

El usuario originalmente los definió como:

```text
nombre
descripción
precio de costo
porcentaje de venta
precio de venta
margen
código
distribuidor
xmayo
precio xmayor
foto
```

Interpretación:

* `name`: nombre del producto.
* `description`: descripción.
* `costPrice`: precio/costo actual.
* `markup`: porcentaje que se agrega al costo para calcular venta.
* `salePrice`: precio de venta actual.
* `margin`: margen.
* `code`: código de barras/código del producto.
* `supplierId`: distribuidor asociado.
* `wholesaleMinimumQuantity`: cantidad desde la que empieza el precio mayorista.
* `wholesalePrice`: precio por mayor.
* `photo`: foto del producto.

---

# 9. Precio de venta

Decidimos utilizar **markup sobre costo**.

Ejemplo:

```text
Costo: $2.000
Markup: 30%

Precio:
$2.000 × 1,30 = $2.600
```

Esto es diferente de calcular un margen porcentual sobre el precio final.

El porcentaje de venta representa cuánto se agrega sobre el costo.

---

# 10. Redondeo de precios

El usuario quiere que Stockizi redondee automáticamente los precios para ahorrar tiempo.

El redondeo será configurable.

Por ejemplo:

```text
Redondear a:

$1
$10
$50
$100
$500
```

Ejemplo:

```text
Costo: $2.137
Markup: 30%

Resultado:
$2.778,10

Redondeado a $100:
$2.800
```

---

# 11. Actualización automática de precios

Cuando cambia el costo de un producto, Stockizi podrá calcular un nuevo precio utilizando el markup configurado.

Ejemplo:

```text
Costo anterior: $2.000
Costo nuevo: $2.200

Markup: 30%

Nuevo precio sugerido:
$2.860

Redondeado:
$2.900
```

La idea es que Stockizi pueda preguntar:

```text
¿Actualizar precio de venta a $2.900?

[ Sí ] [ No ]
```

La actualización automática debe diseñarse con cuidado para que el usuario tenga control.

---

# 12. Precio mayorista

El producto puede tener un precio mayorista.

Ejemplo:

```text
Precio normal: $2.600

Cantidad mínima mayorista: 5

Precio mayorista: $2.400
```

Entonces:

```text
1 → $2.600
2 → $2.600
3 → $2.600
4 → $2.600
5 → $2.400
6 → $2.400
...
```

La cantidad mínima será configurable por producto.

---

# 13. Distribuidores

El usuario NO necesita mucha información administrativa de los distribuidores.

Lo importante es:

```text
Supplier
--------
id
name
active
createdAt
updatedAt
```

La función principal será:

```text
Distribuidores
↓
Elegir distribuidor
↓
Ver productos asociados
↓
Modificar precios
```

Ejemplo:

```text
DISTRIBUIDORA X

Producto       Costo       Venta

Producto A     $2.000      $2.600
Producto B     $3.000      $3.900
Producto C     $1.500      $2.000
```

---

# 14. Actualización masiva desde distribuidor

El usuario quiere poder seleccionar varios productos de un distribuidor y aplicar un aumento.

Ejemplo:

```text
☑ Producto A
☑ Producto B
☑ Producto C

Aumentar:

+$100

o

+5%

[ Aplicar ]
```

Esto debe actualizar los precios de los productos seleccionados.

---

# 15. Administración desde celular

Se quiere una interfaz web privada para poder realizar tareas administrativas desde el teléfono.

No queremos copiar toda la aplicación de escritorio al celular.

La versión móvil debe centrarse en acciones rápidas:

```text
Productos
Distribuidores
Precios
Stock
Caja
Gastos
Ventas
```

Funciones especialmente importantes desde celular:

* Actualizar precios.
* Actualizar productos.
* Aumentar precios de productos de un distribuidor.
* Ver stock.
* Ver productos con stock bajo.
* Ver caja.
* Registrar gastos.
* Consultar ventas.
* Consultar información del negocio.

---

# 16. Compras

Los proveedores actualmente se pagan **en el momento**.

Sin embargo, queremos diseñar el sistema de forma suficientemente flexible para poder soportar pagos parciales o deuda en el futuro.

Estructura conceptual:

```text
Supplier
   ↓
Purchase
   ↓
PurchaseItem
   ↓
Product
```

`Purchase`:

```text
id
supplierId
total
createdAt
```

`PurchaseItem`:

```text
id
purchaseId
productId
quantity
unitCost
subtotal
```

---

# 17. Qué sucede cuando se registra una compra

Ejemplo:

```text
Distribuidor: Distribuidora X

10 × Producto A → $2.000
20 × Producto B → $3.500

Total: $90.000
```

Al confirmar la compra:

```text
1. Aumenta el stock.
2. Guarda el costo de los productos.
3. Guarda la compra en el historial.
4. Registra el pago.
5. Registra la salida de dinero.
6. Conserva el historial del costo.
```

---

# 18. Historial de costos

No queremos perder los costos anteriores.

Un producto podría haber costado:

```text
02/08 → $2.000
10/08 → $2.300
18/08 → $2.500
```

Aunque `Product.costPrice` tenga actualmente:

```text
$2.500
```

las compras anteriores conservan el costo histórico.

Esto permitirá posteriormente analizar aumentos de proveedores y rentabilidad.

---

# 19. Ventas

Una venta debe guardar los productos vendidos.

Conceptualmente:

```text
Sale
 ↓
SaleItem
 ↓
Product
```

Una venta contiene uno o varios `SaleItem`.

`SaleItem` debe guardar al menos:

```text
productId
quantity
unitPrice
subtotal
```

También es recomendable guardar el costo al momento de la venta para poder calcular rentabilidad histórica correctamente:

```text
unitCost
```

---

# 20. Qué sucede cuando se hace una venta

Cuando se confirma una venta normal:

```text
1. Baja el stock.
2. Se registra la venta.
3. Se registran los productos vendidos.
4. Se registra el/los pagos.
5. Entra dinero si corresponde.
6. Aumentan las estadísticas.
7. Aparece en el historial.
```

---

# 21. Cuenta corriente

Si una venta es a cuenta corriente:

```text
Venta
↓
Stock disminuye
↓
NO entra dinero todavía
```

No se debe registrar un cobro hasta que el cliente efectivamente pague.

Cuando posteriormente paga:

```text
Pago
↓
entra dinero
↓
se registra Payment
↓
se relaciona con la deuda/venta correspondiente
```

---

# 22. Presupuestos

Un presupuesto NO es una venta.

Cuando se crea un presupuesto:

```text
NO baja stock
NO entra dinero
NO afecta caja
NO aumenta ventas
```

Queda guardado en el historial.

Después puede convertirse/cargarse como venta cuando el cliente finalmente compra.

Esto permite reutilizar presupuestos anteriores.

---

# 23. Payment

Decisión importante:

Una venta puede tener **uno o varios pagos**.

Ejemplo:

```text
VENTA #1523
Total: $50.000

Efectivo:       $20.000
Transferencia:  $15.000
Posnet:         $15.000
```

`Payment` NO debe guardar los productos.

Los productos pertenecen a `SaleItem`.

`Payment` solamente necesita información relacionada con el cobro:

```text
id
method
amount
createdAt
```

y la relación correspondiente con la operación.

Métodos previstos:

```text
CASH
TRANSFER
CARD
QR
OTHER
```

La lista puede crecer.

---

# 24. Caja

La caja representa un período de trabajo.

Ejemplo:

```text
Caja #128
18/08/2026

Apertura: $100.000
```

Durante el día:

```text
Ventas efectivo: +$350.000
Gastos:          -$40.000
Retiro:          -$100.000
```

Cierre esperado:

```text
$310.000
```

El usuario cuenta físicamente:

```text
$309.500
```

Stockizi muestra:

```text
Diferencia: -$500
```

---

# 25. CashRegister

Conceptualmente:

```text
CashRegister
------------
id
date
openingAmount
expectedAmount
closingAmount
status
openedAt
closedAt
userId
```

Importante:

* `openingAmount`: dinero con el que comenzó.
* `expectedAmount`: dinero que Stockizi calcula.
* `closingAmount`: dinero contado físicamente.
* La diferencia permite detectar errores.

---

# 26. CashMovement

Todo movimiento de caja debe poder quedar registrado.

Ejemplo de ingreso:

```text
Tipo: INGRESO
Concepto: Venta #1523
Medio: Efectivo
Monto: $20.000
```

Ejemplo de egreso:

```text
Tipo: EGRESO
Concepto: Pago proveedor
Medio: Efectivo
Monto: $50.000
```

Otros movimientos:

* Gastos.
* Pagos a proveedores.
* Retiros.
* Reservas.
* Ingresos manuales.
* Ajustes.

---

# 27. Diferencia entre ventas y caja física

Es muy importante no mezclar:

```text
DINERO DE LAS VENTAS
```

con:

```text
DINERO FÍSICO EN LA CAJA
```

Ejemplo:

```text
Ventas del día: $820.000

Efectivo:       $350.000
Transferencias: $280.000
Posnet:         $190.000
```

La transferencia y el Posnet son ingresos, pero no necesariamente representan billetes dentro de la caja.

---

# 28. Resumen diario

Al cerrar la caja queremos mostrar algo como:

```text
RESUMEN DEL DÍA

VENTAS
----------------
Efectivo       $350.000
Transferencia  $280.000
Posnet         $190.000

Total          $820.000

CAJA FÍSICA
----------------
Inicial        $100.000
Ingresos       $350.000
Egresos        $140.000

Esperado       $310.000
Real           $309.500

Diferencia       -$500
```

---

# 29. Gastos

Queremos registrar gastos como:

* Luz.
* Gas.
* Proveedores.
* Otros gastos del negocio.

Los gastos podrán consultarse desde PC y también desde el celular.

Los gastos deben afectar correctamente la caja/dinero cuando corresponda, pero también deben distinguirse de retiros o reservas.

---

# 30. Retiro / dinero para reposición

El usuario suele separar dinero para:

* Restock.
* Inversión.
* Reposición de mercadería.

Esto NO necesariamente es un gasto.

Ejemplo:

```text
Caja: $500.000

Se separan $200.000 para reposición.
```

Conceptualmente queremos poder mostrar:

```text
Caja física:              $300.000
Reservado para reposición: $200.000

Dinero total:             $500.000
```

La reserva no debe falsear las estadísticas de ganancias.

---

# 31. Estadísticas

Cuando se hace una venta:

```text
ventas ↑
ingresos ↑
productos vendidos ↑
```

Pero las estadísticas deben diferenciar correctamente:

* Ventas.
* Cobros.
* Efectivo.
* Transferencias.
* Posnet.
* Cuenta corriente.
* Gastos.
* Rentabilidad.

---

# 32. ARCA / Posnet

El usuario quiere poder controlar las ventas realizadas mediante Posnet y luego pasarlas a ARCA.

Para `Payment` solamente interesa:

```text
monto
método
fecha
```

No hace falta guardar nuevamente qué producto se vendió dentro del pago.

La parte específica de integración con ARCA se diseñará más adelante.

---

# 33. Multi-PC

Stockizi debe poder utilizarse en más de una PC.

La idea final es:

```text
PC 1 ─────┐
          │
PC 2 ─────┼──── API ──── PostgreSQL
          │
Celular ──┘
```

Todos trabajan con la misma información.

Esto significa que NO queremos que cada PC tenga su propia base de datos independiente.

---

# 34. Seguridad / usuarios

Más adelante probablemente tendremos:

```text
User
----
id
name
username/email
passwordHash
role
active
```

Roles posibles:

```text
ADMIN
EMPLOYEE
```

Pero esto todavía no está implementado.

---

# 35. Flujo completo esperado

A futuro, el circuito principal será:

```text
                ┌──────────────┐
                │   SUPPLIER   │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │   PURCHASE   │
                └──────┬───────┘
                       │
                       ▼
                    STOCK ↑
                       │
                       │
PRODUCT ────────────────┤
   │                   │
   │                   ▼
   │                 SALE
   │                   │
   │                   ▼
   │                PAYMENT
   │                   │
   │                   ▼
   │              CASH REGISTER
   │
   └── precio/costo/markup
```

---

# 36. Objetivo de aprendizaje

El usuario quiere aprender programación mientras construimos el proyecto.

Por lo tanto, cuando se agregue código, explicar conceptos como:

* Variables.
* Funciones.
* Objetos.
* Arrays.
* Tipos.
* Interfaces/types de TypeScript.
* Módulos.
* Imports/exports.
* Eventos.
* Componentes React.
* Estado.
* Props.
* API.
* HTTP.
* Base de datos.
* SQL.
* Relaciones.
* CRUD.
* Backend/frontend.
* Electron.
* Seguridad.
* Autenticación.

No asumir que el usuario ya sabe estos conceptos.

---

# 37. Punto exacto donde quedamos

Ya tenemos el proyecto inicial funcionando con Electron.

La carpeta real es:

```text
C:\Users\ezema\Desktop\stockizi
```

Archivos existentes:

```text
node_modules/
index.html
main.js
package-lock.json
package.json
stockizi.md
```

Electron ya está instalado.

Ya se ejecutó una primera ventana de Stockizi.

El próximo paso recomendado es **inspeccionar el `main.js`, `index.html` y `package.json` existentes**, explicar qué hace cada uno y después comenzar a transformar esa versión básica en una aplicación estructurada con TypeScript/React.

NO volver a instalar Electron si ya está instalado.

NO crear otro proyecto desde cero sin revisar primero el proyecto existente.

---

# 38. Regla importante para continuar

Antes de modificar archivos existentes, comprobar qué contienen.

El usuario quiere entender lo que está pasando, por lo que primero explicar:

```text
qué tenemos
qué hace
qué falta
qué vamos a cambiar
```

y luego implementar.

---

# 39. Nombre oficial

El programa se llama:

# STOCKIZI

Ese nombre debe utilizarse en el proyecto, interfaz y documentación.
