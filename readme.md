# STOCKIZI — Documento maestro del proyecto

Reorganización documental: **16/09/2026**. Respaldo previo: **2e96493**, con el mismo contenido del proyecto que **a385b7c**. Esta revisión no modifica la aplicación, las migraciones ni la base de datos.

## Cómo leer este documento

- **Implementado actualmente:** existe en código. Se aclara si la verificación fue automatizada, aislada o confirmada por el usuario.
- **Acordado, falta implementar:** el comportamiento fue confirmado, pero todavía no existe o difiere de lo que hace el programa.
- **Planificado:** alcance o etapa futura; sus detalles no están necesariamente decididos.
- **Decisiones pendientes:** elecciones funcionales o técnicas aún abiertas. No convertir una propuesta en autorización.
- El historial es referencia, **no una lista de pasos para ejecutar hoy**. Las antiguas instrucciones de instalación/migraciones no deben repetirse por aparecer allí.

Índice:

1. [A. Estado actual y próximo paso](#estado-actual)
2. [B. Funciones y reglas acordadas](#funciones)
3. [C. Decisiones pendientes e ideas futuras](#pendientes)
4. [D. Arquitectura, archivos y mantenimiento](#arquitectura)
5. [E. Historial de decisiones y avances](#historial)

Se mantienen los números originales de las secciones temáticas (por ejemplo, 8.3 o 19.1) para poder reconocer referencias de conversaciones y otras guías. Se reubican bajo los bloques A–E, por eso no aparecen en orden numérico continuo. Los ejemplos, modelos y observaciones de StockFácil/Excel se conservan.

<a id="estado-actual"></a>

## A. Estado actual y próximo paso

### Implementado y comprobado en archivos

- Electron + HTML/CSS/JavaScript; API HTTP nativa de Node con `pg`; PostgreSQL local `stockizi_dev`. React y TypeScript no están implementados.
- Productos: alta con stock inicial; edición de nombre, costo, venta y porcentaje; rubros/subcategorías opcionales con nombres propios; múltiples códigos de texto.
- Al crear, producto y movimiento INITIAL se guardan juntos. Stock inicial no negativo; UNIT entero; kilo/metro/litro hasta tres decimales. Stock/unidad de un producto guardado permanecen protegidos.
- Catálogo por páginas de 100. Nombre/rubro/subcategoría filtran lo cargado; búsqueda exacta por código consulta toda la base. IDs distinguen productos con nombres repetidos.
- Guardar exige cambios válidos y respuesta confirmada; errores conservan el borrador. Cancelar restaura. Navegación conserva borrador; cambiar de producto/actualizar con cambios pendientes se bloquea.
- Rubros y códigos tienen administración propia. Desactivar un código no equivale a desactivar un producto; esto último todavía no tiene operación de pantalla/API.
- Caja y Nueva venta son secciones informativas; Inicio muestra el estado del prototipo. No hay ventas, compras, clientes, pagos, cuenta corriente, gastos, fotos ni backups automáticos.
- Presentación: catálogo arriba y ficha abajo. En ventanas bajas se permite desplazar la página; no prometer que la ficha está siempre visible.
- La API solo escucha en `127.0.0.1`. Roles SQL y aislamiento Electron no son login de empleados ni autorización multi-PC.

### Diferencias importantes entre el código y los acuerdos

| Función | Código actual | Acuerdo pendiente de implementación |
| --- | --- | --- |
| Precio del catálogo | Pantalla/API/PostgreSQL exigen venta mayor que costo; 007 confirmada por el usuario | Excepciones específicas en Ventas todavía por definir; sin corrección automática |
| Redondeo | Centavos técnicos | Opcional, general, desactivado por defecto; múltiplo más cercano y empate arriba |
| Costo | Edición manual del valor actual | Última compra actualiza costo; historial de compras y ediciones manuales |
| Producto activo | Campo almacenado y estado visible | Desactivar/reactivar, conservar stock/historial, aviso de existencias y filtro |
| Proveedores | No implementados | Opcionales y múltiples por producto; compra sin proveedor asignable después |
| Clientes y pagos | No implementados | Deudas/saldos a favor, pagos parciales y medios combinados |
| Compras | No implementadas; INITIAL no es compra | Pago completo/parcial/pendiente, correcciones auditadas y saldos a favor |

### Migraciones: qué existe y qué confirmó el usuario

| Archivo | Efecto real | Estado comunicado de stockizi_dev |
| --- | --- | --- |
| 001_create_products.sql | products, identidad, dinero exacto, reglas de stock/unidad | Aplicada; tabla y consultas confirmadas |
| 002_create_reader.sql | Rol de consulta | Aplicada; consulta API confirmada |
| 003_enable_product_editing.sql | Editor limitado y CHECK venta >= costo | Aplicada; edición y reconsulta confirmadas |
| 004_initial_stock.sql | Alta idempotente y movimiento INITIAL automático | Alta y presencia en API confirmadas; consulta manual del movimiento aún sin confirmación específica |
| 005_categories.sql | Rubros/subcategorías y vínculos opcionales | Funcionamiento confirmado |
| 006_product_codes.sql | Asociaciones de códigos, unicidad activa y retiro lógico | Usuario informó COMMIT exitoso el 16/09/2026; falta confirmar recorrido manual de códigos en su ventana |
| 007_sale_above_cost.sql | CHECK venta > costo; falla ante igualdades sin corregir precios | Usuario confirmó COMMIT, controles sin filas inválidas y funcionamiento; registrado el 17/09/2026 |

Las confirmaciones de la base habitual provienen del usuario, no de una conexión del asistente. No repetir 001–007 ni modificar retrospectivamente una migración aplicada. La regla estricta está en pantalla/API/PostgreSQL. Para nuevas instalaciones, check_product_prices.sql consulta sin modificar; revisar y decidir cualquier precio inválido antes de aplicar 007.

### Verificación y límites

- `npm test`: 68 pruebas aprobadas, incluidas reglas de precio estricto y protección de salida. El recorrido Electron/API/PostgreSQL temporal también pasó con 007 y cierre/recarga reales; las respuestas del diálogo nativo se simulan en la prueba. No se modificó la base habitual.
- El recorrido completo Electron → IPC → API → PostgreSQL temporal se verificó en la etapa anterior con 001–006, incluido precio/cantidad, reintentos concurrentes, rubros, códigos y búsqueda fuera de primera página. No se vuelve a afirmar como ejecutado durante esta edición documental.
- Cerrar o recargar normalmente avisa sobre borradores de productos, rubros/subcategorías y códigos. Seguir editando es la opción predeterminada; descartar continúa la salida sin guardar. Una operación en curso cancela ese intento: cerrar el aviso, revisar el resultado y volver a intentar. No es autoguardado ni protección ante corte de luz, caída o cierre forzado; los backups siguen pendientes.
- No hay tabla/ejecutor de seguimiento automático de migraciones, protección completa contra pérdida de conexión, instalador productivo, autenticación de usuarios ni despliegue compartido.
- No se importó el Excel de artículos ni el Excel de deudas; no se debe inventar información faltante.

### Próximo paso

1. Revisar esta organización y confirmar manualmente códigos tras 006: agregar dos a un producto, buscar por ambos y rechazar uno usado por otro.
2. Comprobar manualmente el aviso de cierre/recarga: conservar un borrador, luego descartarlo explícitamente. 007 y sus controles ya fueron confirmados; no repetir la migración.
3. Retomar la construcción incremental: planificar el selector de Nueva venta y los flujos ya acordados sin dar Compras/Clientes/Caja por existentes.
4. Resolver las decisiones técnicas o comerciales pendientes cuando se alcance su función, especialmente almacenamiento/backups, redondeo de venta por importe, permisos y correcciones.
5. Mantener el historial de decisiones reemplazadas separado de estas instrucciones actuales.

<a id="funciones"></a>

## B. Funciones y reglas acordadas

En cada función las cuatro etiquetas separan existencia, acuerdo, planificación y decisión pendiente. Los modelos de entidades futuros son diseños conceptuales, no SQL que deba ejecutarse ni promesas de funciones terminadas.

### Protección de cambios al cerrar o recargar (17/09/2026)

- **Implementado actualmente:** Cada formulario informa si tiene cambios o una operación pendiente. `exit-guard.js` intercepta la salida normal; `exit-dialog.js` presenta el aviso nativo mediante un canal limitado de Electron. Seguir editando, Escape y cerrar el aviso conservan el borrador. Descartar continúa el cierre/recarga, sin guardar ni deshacer datos ya confirmados. Durante una operación pendiente no se ofrece descartar y no se sale automáticamente al terminar.
- **Acordado, falta implementar:** Sin pendiente adicional para este aviso; los backups acordados siguen en su sección propia.
- **Planificado:** Incorporar los formularios futuros a esta protección cuando existan.
- **Decisiones pendientes:** Recuperación persistente de borradores después de una caída; no se implementó ni se presupone autoguardado.

La protección no garantiza conservación frente a cortes de luz, fallos del proceso o cierre forzado del sistema. La prueba automatizada ejecuta cierre/recarga de Electron y un guardado retenido en PostgreSQL temporal, simulando solamente las respuestas del diálogo.

### 1. Objetivo del proyecto

Estamos construyendo **Stockizi**, un programa de escritorio para controlar un negocio real.

La prioridad es construir una aplicación funcional que ayude al negocio del usuario y su mamá. También quiere **aprender programación mientras se construye el programa real**; el aprendizaje debe acompañar el avance, no convertirse en una condición que lo frene.

El desarrollo será progresivo y explicado. La dinámica de trabajo y aprendizaje se describe en `DESARROLLO.md`, archivo local ignorado por Git que no recibe quien clona el repositorio.

La aplicación principal será de **escritorio**, pero tendrá una **interfaz web privada para administrar ciertas cosas desde el celular**.

---

### 5. Cómo queremos desarrollar

No queremos hacer todo de golpe.

Hoja de ruta aproximada:

```text
FASE 0 — Fundamentos (COMPLETADA)
Electron, npm, archivos principales, CSS separado y flujo Git/GitHub.

FASE 1 — Prototipo de aprendizaje (EN CURSO)
JavaScript, formulario de productos, unidades y navegación inicial.

FASE 2 — Base técnica de la interfaz (PLANIFICADA)
React, TypeScript, componentes, navegación y estructura del proyecto.

FASE 3 — Datos centrales (EN CURSO: API local y productos persistentes implementados)
API, PostgreSQL, persistencia, productos, stock y distribuidores.

FASE 4 — Operación comercial (PLANIFICADA)
Compras, ventas, pagos, presupuestos y cuenta corriente.

FASE 5 — Dinero y control (PLANIFICADA)
Caja, gastos, retiros, reservas, cierre y resumen diario.

FASE 6 — Acceso móvil y colaboración (PLANIFICADA)
Web privada, tareas, actualización de precios y carga de fotos.

FASE 7 — Seguridad y entrega (PLANIFICADA)
Usuarios, permisos, copias de seguridad, pruebas, instalador y despliegue.
```

El orden puede cambiar si durante el desarrollo encontramos una razón técnica para hacerlo.

Las fases indican un orden de construcción, no versiones automáticamente listas para usar en el negocio. Pruebas, integridad de datos, seguridad y copias de respaldo se incorporarán durante el desarrollo de las funciones correspondientes, no solamente al final.

#### 5.1. Navegación prevista

- **Implementado actualmente:** Barra lateral con Inicio, Nueva venta, Productos y Caja; solo Productos tiene gestión persistente.
- **Acordado, falta implementar:** Clientes tendrá Deudas y saldos a favor; el resto de módulos conserva responsabilidades separadas.
- **Planificado:** Organización amplia debajo como mapa de alcance, no pantallas existentes.
- **Decisiones pendientes:** Ubicación definitiva de accesos adicionales a cuenta corriente, historial y reportes.

La aplicación de escritorio utilizará una barra lateral para poder crecer sin acumular demasiadas pestañas horizontales.

Organización inicial:

```text
STOCKIZI

OPERACIÓN DIARIA
├── Inicio
├── Nueva venta
├── Productos
└── Caja

GESTIÓN
├── Compras
├── Distribuidores
├── Clientes
├── Cuenta corriente
├── Presupuestos
└── Gastos

ANÁLISIS
├── Historial
├── Reportes
└── Resumen diario

SISTEMA
├── Usuarios
└── Configuración
```

Responsabilidades principales:

* `Inicio`: resumen del día, estado de caja, tareas pendientes y alertas de stock.
* `Nueva venta`: carrito, búsqueda de productos, cantidades, precios y pagos.
* `Productos`: catálogo, precios, stock, unidades, fotos y códigos.
* `Caja`: apertura, movimientos, retiros, reservas y cierre.
* `Compras`: ingreso de mercadería y actualización de costos.
* `Distribuidores`: proveedores y productos asociados.
* `Clientes`: información del cliente y apartado Deudas y saldos a favor, con historial de ventas y cobros.
* `Cuenta corriente`: concepto compartido por clientes y proveedores; no se decidió duplicar su pantalla fuera de Clientes/Distribuidores.
* `Presupuestos`: operaciones que todavía no son ventas.
* `Gastos`: egresos del negocio.
* `Historial`: operaciones anteriores.
* `Reportes`: estadísticas, rentabilidad e información de Posnet/ARCA.
* `Usuarios`: empleados, acceso y permisos.
* `Configuración`: redondeo, datos del negocio y preferencias.

No se usará una única sección genérica llamada `Contabilidad`, porque caja, gastos, compras, cuenta corriente y reportes representan conceptos diferentes. Pueden agruparse visualmente sin mezclar su lógica.

La primera navegación funcional se centrará en:

```text
Inicio
Nueva venta
Productos
Caja
```

Estas cuatro secciones son un punto de partida para desarrollar la interfaz, no el alcance completo de la primera versión operativa.

#### 5.2. Alcance para incorporar Stockizi al negocio

El prototipo de aprendizaje y una versión operativa son cosas diferentes. No se considerará suficiente una versión pequeña que omita tareas indispensables del negocio.

El alcance operativo debe contrastarse con los requisitos de este documento y con la aplicación que ya se usa. Incluye casi todas las funciones de negocio ya nombradas:

* Productos, rubros, múltiples códigos, fotos, unidades y control de stock.
* Costos, markup, redondeo, precios minoristas/mayoristas y actualización individual o masiva.
* Distribuidores, compras e ingreso de mercadería.
* Ventas, carrito, búsqueda rápida, venta por peso, modificación manual de precios y advertencia de stock negativo.
* Pagos por distintos medios, pagos combinados, historial y correcciones auditables.
* Presupuestos, clientes y cuenta corriente.
* Apertura/cierre de caja, movimientos, gastos, retiros, reservas y resumen diario.
* Reportes y la información necesaria para el flujo de Posnet/ARCA.
* Acceso móvil administrativo, tareas pendientes y carga de fotos según las necesidades acordadas.
* Persistencia confiable, respaldo y acceso seguro para la forma real de trabajo.

Antes de poner Stockizi en uso se verificará cada tarea indispensable mediante escenarios reales, incluidos errores y correcciones. No se inventarán requisitos faltantes ni se eliminarán funciones necesarias para reducir artificialmente el alcance.

La aplicación actual y sus secciones ya fueron identificadas por el usuario; se describen en la sección 5.3. Todavía debe decidirse si Stockizi la reemplazará o la complementará y qué migración o convivencia será necesaria.

Una web pública de compras y otras expansiones no necesarias para la operación actual pueden quedar para el futuro. Las variantes por color y la conversión automática de bultos siguen en la sección de ideas futuras por decisión del usuario.

#### 5.3. Sistema actual y transición

Información confirmada por el usuario:

* El negocio usa StockFácil de [VP Sistemas](https://www.vpsistemas.com/).
* Actualmente trabajan con una computadora.
* El programa permite exportar o trasladar productos mediante Excel.
* Las secciones identificadas son: artículos, proveedores, clientes, ventas, caja, estadísticas, gastos y contabilidad.

El alcance deseado y los cambios respecto al sistema actual siguen siendo los descritos en este README. El usuario continuará completándolo para ordenar productos y contabilidad; los nombres de las secciones de StockFácil no obligan a copiar su organización ni confirman todos sus detalles operativos.

Pendientes antes de diseñar una importación o transición:

* Contrastar el archivo de ejemplo ya revisado con una exportación completa del negocio antes de migrar.
* Definir cómo importar unidades de medida, subrubros, fotos y códigos adicionales, ausentes en el ejemplo.
* Comprobar si pueden exportarse clientes, proveedores, deudas o historial; no se presupone esa capacidad.
* Decidir qué información se migrará y cómo se validará, sin sobrescribir datos reales accidentalmente.
* Definir reemplazo o convivencia con StockFácil y las tareas indispensables para poner Stockizi en uso.

El 13/09/2026 se inspeccionó `apuntes/ejemplo/ejemplom excel articulos.xlsx`: contiene una hoja `Sheet1`, 6 artículos de prueba y 14 columnas. Confirma que este ejemplo incluye códigos, stock, costos y precios; no confirma que puedan exportarse otras entidades ni que todos los archivos futuros tengan el mismo formato.

#### 5.4. Referencia revisada: videos y Excel de StockFácil

Se revisaron fotogramas de los cuatro videos de `apuntes/ejemplo/` y la transcripción automática local de sus audios. Las explicaciones se contrastaron con las pantallas; los importes de prueba y las dudas del usuario no se convierten en reglas definitivas. No se ejecutaron operaciones sobre la base del negocio.

##### Funcionamiento y necesidades observadas

* `interfaz, articulos.mp4` (2:14): catálogo arriba y ficha abajo, selección, modificación y creación; Guardar se habilita en edición. Hay acceso a familias y proveedores desde la ficha, códigos con letras, foto y venta por kilo/litro/metro. Se mostraron problemas y dudas del programa de referencia que no deben copiarse. La caja de pizza marcada por peso es un ejemplo de prueba, no un cambio de la regla de unidades enteras de Stockizi.
* `ventas.mp4` (2:29): es la pantalla donde más tiempo trabaja el usuario. Se busca y selecciona un artículo sin perder la venta, se modifica el precio del renglón sin cambiar el catálogo, y se ingresa cantidad en gramos o importe para venta por peso. Se muestran contado/Mercado Pago, descuentos, recargos y artículo rápido con descripción y precio para mercadería todavía no cargada. Las listas de precios y las promociones necesitan definición propia; el usuario indicó que las promociones pueden omitirse por ahora. No se presupone el alcance de devoluciones por la sola presencia del botón.
* `proveedores clientes compras.mp4` (1:45): el usuario no utiliza actualmente proveedores ni clientes en StockFácil y no tiene claro su funcionamiento. Quiere poder usar Compras con una interfaz más simple. Se muestran usuarios y permisos; su alcance sigue por decidir. Esto no elimina las funciones ya planificadas para Stockizi.
* `contabilidad.mp4` (3:14): interesa el inicio de caja, los movimientos separados por medio de pago, la consulta de ventas por día/mes/rango y el detalle de cada venta. El usuario consulta ese detalle desde Contabilidad, no habitualmente desde Artículos vendidos de Caja. Para corregir un medio de pago hoy vuelve a cargar la operación mediante presupuesto y anula la anterior: quiere un procedimiento más cómodo.

Propuestas pendientes de acordar antes de implementar:

* Corregir el medio de pago desde el historial, conservando venta, stock y trazabilidad. Definir permisos, motivo, tratamiento de cajas cerradas y actualización de los movimientos; no borrar ni duplicar ventas silenciosamente.
* Definir artículo rápido: si crea o no un producto, cómo se registra su costo y cómo se trata su stock. No asumir costo cero como ganancia real.
* Definir límites, orden de aplicación, permisos y redondeo de descuentos y recargos.
* Mostrar el inventario a costo con ese nombre, distinguiéndolo de ventas, costo de mercadería vendida y resultado bruto. El costo histórico de cada venta debe conservarse al cambiar costos actuales. El resultado bruto no representa por sí solo el resultado después de gastos.

##### Columnas del Excel de ejemplo

`CODIGO`, `DETALLE`, `FAMILIA`, `PROVEEDOR`, `MARCA`, `P.COSTO`, `P.VENTA`, `IVA`, `P.LISTA2`, `P.LISTA3`, `P.MAYOR`, `STOCK`, `STOCK MIN`, `STOCK IDEAL`.

Observaciones para diseñar el importador, todavía no implementado:

* Hay códigos numéricos y alfanuméricos: tratarlos como identificadores de texto. Si un origen numérico ya perdió ceros iniciales, no pueden recuperarse por suposición.
* Hay familia, proveedor y marca vacíos. `FAMILIA` podría mapearse a rubro, pero debe confirmarse; no inventar asociaciones por el contenido de un nombre.
* Hay stock negativo y un valor `-0.375999987125397`. Conservar el dato original para revisión y acordar normalización a la precisión de la unidad, sin convertir negativos en cero ni redondear silenciosamente unidades enteras.
* No hay una columna de unidad de medida, subrubro, foto ni códigos alternativos. No deducirlos únicamente del nombre del artículo.
* El IVA incluye un valor de prueba 34; no convertirlo en configuración fiscal por defecto. Las listas 2/3 y el precio mayorista no definen por sí solos reglas de descuentos o cantidades mínimas.
* Propuesta de importación: vista previa de correspondencias, duplicados, faltantes y errores antes de confirmar; no sobrescribir datos existentes automáticamente.

Los videos, fotogramas y transcripciones no se incorporan al código ni a Git. La extracción y transcripción se realizaron en una carpeta temporal fuera del proyecto.

---

### 6. Flujo diario del negocio

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

### 7. Funciones deseadas

- **Implementado actualmente:** Alta, edición de precios/nombre, clasificación y códigos; ver el detalle de cada función.
- **Acordado, falta implementar:** Decisiones confirmadas en esta revisión, listadas por función debajo.
- **Planificado:** El listado siguiente conserva el alcance general, no afirma que todo exista.
- **Decisiones pendientes:** Detalles de las funciones aún no construidas se enumeran en C.


Stockizi debe permitir:

* Cargar productos.
* Editar productos.
* Desactivar y reactivar productos conservando historial y stock; no borrarlos físicamente como operación habitual.
* Buscar productos.
* Buscar por nombre.
* Buscar por cualquiera de los códigos de barras asociados a un producto.
* Filtrar productos por rubro o categoría.
* Ofrecer una búsqueda visual por nombre y foto para agilizar ventas y cambios de precio.
* Controlar stock.
* Manejar productos por unidad, peso, longitud o volumen.
* Permitir ventas con stock insuficiente, mostrando una advertencia y conservando el stock negativo.
* Avisar cuando un producto tiene poco stock.
* Mostrar foto del producto.
* Poder ampliar/ver la foto del producto.
* Filtrar productos que todavía no tienen foto.
* Asociar productos a distribuidores.
* Actualizar precios individualmente.
* Actualizar precios de varios productos.
* Aumentar precios por cantidad fija.
* Aumentar precios por porcentaje.
* Actualizar precios desde el celular.
* Crear y completar recordatorios de actualización.
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

### 8. Producto

- **Implementado actualmente:** Ficha con nombre, costo, venta, markup, unidad, stock, active, fecha de creación, IDs de clasificación; creación idempotente. No todos los campos del modelo objetivo existen.
- **Acordado, falta implementar:** Desactivar/reactivar sin borrar historial ni stock; avisar si quedan existencias. No ofrecer inactivos en ventas nuevas y poder consultarlos/reactivarlos con filtro. Proveedores opcionales y múltiples.
- **Planificado:** Descripción, fotos, umbral de stock bajo, mayorista y auditoría ampliada del modelo objetivo.
- **Decisiones pendientes:** Diseño de campos y permisos futuros; comportamiento de códigos de productos inactivos antes de implementar la desactivación.


Modelo funcional objetivo de `Product`, NO listado de columnas ya implementadas. Los campos futuros se conservan para no perder alcance:

```text
id
name
description
costPrice
markupPercentage
salePrice
margin (calculado)
barcodes
suppliers (relación opcional con varios proveedores; estructura SQL por diseñar)
categoryId
subcategoryId
stock
unit
lowStockThreshold
wholesaleMinimumQuantity
wholesalePrice
photoReference
active
createdAt
updatedAt
```

El usuario originalmente los definió como:

```text
nombre
descripción
precio de costo
porcentaje de venta
precio de venta
margen
código o códigos
distribuidor
xmayo
precio xmayor
foto
```

Interpretación:

* `name`: nombre del producto.
* `description`: descripción.
* `costPrice`: precio/costo actual.
* `markupPercentage`: porcentaje que se agrega al costo para calcular venta.
* `salePrice`: precio de venta actual.
* `margin`: valor calculado para reportes; queda por decidir si también debe persistirse.
* `barcodes`: colección de códigos que permiten encontrar el mismo producto.
* `suppliers`: relación opcional con varios distribuidores, sin duplicar producto, precio ni existencias. Aún no hay tabla ni API de proveedores.
* `categoryId`: rubro o categoría principal del producto.
* `subcategoryId`: subcategoría opcional perteneciente al rubro elegido en el prototipo actual.
* `stock`: cantidad disponible del producto. Debe admitir decimales.
* `unit`: unidad de medida utilizada para interpretar el stock y las cantidades.
* `lowStockThreshold`: cantidad a partir de la cual se muestra una alerta de stock bajo.
* `wholesaleMinimumQuantity`: cantidad desde la que empieza el precio mayorista.
* `wholesalePrice`: precio por mayor.
* `photoReference`: URL o clave que permite localizar la foto fuera de la tabla del producto.
* `active`: permite desactivar el producto sin perder su historial.
* `createdAt` y `updatedAt`: fechas de creación y última actualización.

#### 8.1. Stock y unidades de medida

- **Implementado actualmente:** UNIT entero; kilo/metro/litro hasta tres decimales. Alta no negativa con movimiento INITIAL incluso cero; stock/unidad existentes protegidos. La tabla products admite negativos, pero el alta vía API y su trigger no los admiten.
- **Acordado, falta implementar:** Compras con cantidad base manual; futuras ventas pueden dejar stock negativo con advertencia y movimiento.
- **Planificado:** Otros movimientos (compras, ventas, ajustes, pérdidas) y consulta de su historial.
- **Decisiones pendientes:** Permisos de ajustes, depósitos y ampliación de unidades. No inventar historial de productos anteriores.


El stock no siempre representa unidades enteras. Algunos productos pueden venderse por peso, longitud o volumen.

Ejemplos:

```text
10 unidades
1,200 kilogramos
3,500 metros
2,250 litros
```

La precisión depende de la unidad:

* `UNIT`: solo admite cantidades enteras. No es válido tener `1,4` cajas o `2,5` unidades.
* `KILOGRAM`: admite hasta tres decimales. `1,200 kg` representa 1 kilo y 200 gramos.
* `METER`: admite hasta tres decimales.
* `LITER`: admite hasta tres decimales.

La interfaz y el backend deben validar esta regla; no alcanza con cambiar el `step` visual del campo.

Unidades iniciales previstas:

```text
UNIT
KILOGRAM
METER
LITER
```

La lista podrá ampliarse si el negocio incorpora otras formas de venta.

En la interfaz se mostrarán abreviaturas fáciles de leer:

```text
UNIT      → un.
KILOGRAM  → kg
METER     → m
LITER     → l
```

Las cantidades de compras (`PurchaseItem.quantity`) y ventas (`SaleItem.quantity`) deben respetar la unidad del producto. Serán enteras para `UNIT` y podrán ser decimales para peso, longitud o volumen.

Implementación actual de stock: `NUMERIC` sin escala fija, con restricciones de finitud, hasta tres decimales y cantidades enteras para `UNIT`. Así se rechaza una cantidad inválida antes de redondearla. Los importes monetarios usan `NUMERIC(12,2)`.

No se utilizará un tipo de coma flotante para cantidades comerciales, con el fin de evitar errores de precisión.

#### 8.2. Fotos de productos

- **Implementado actualmente:** Sin carga, almacenamiento ni visualización de fotos.
- **Acordado, falta implementar:** No hay una nueva decisión específica en esta revisión.
- **Planificado:** Foto PC/celular, miniaturas, vista ampliada y acceso Productos sin foto, detallados debajo.
- **Decisiones pendientes:** Proveedor de almacenamiento, formatos, límites, compresión, permisos y privacidad.


La foto ayudará a identificar un producto cuando el nombre o el código no sean suficientes.

La aplicación debe permitir:

* Cargar o reemplazar una foto desde la PC.
* Tomar una foto o elegirla desde el celular.
* Ver una lista filtrada de productos que todavía no tienen foto.
* Ampliar la imagen desde la ficha o la búsqueda del producto.
* Mostrar una imagen indicativa cuando el producto no tenga foto.

La interfaz móvil tendrá una acción rápida llamada `Productos sin foto`. El flujo esperado será:

```text
Productos sin foto
↓
Elegir producto
↓
Abrir cámara o galería
↓
Confirmar imagen
↓
La foto queda disponible en PC y celular
```

Para mantener el sistema escalable, la base de datos no guardará inicialmente el archivo pesado dentro de `Product`. Guardará una referencia como una URL o clave de almacenamiento. La imagen se almacenará en un servicio o espacio central compartido, con compresión y una miniatura para las listas. La tecnología concreta de almacenamiento se decidirá antes de implementar esta función.

#### 8.3. Códigos de barras y variantes

- **Implementado actualmente:** Tabla product_codes, varios códigos por producto, texto con ceros/letras, unicidad activa, agregar/quitar y búsqueda exacta global. Retirar desactiva la asociación, no el producto.
- **Acordado, falta implementar:** No hay cambios adicionales aprobados en esta revisión.
- **Planificado:** Etiqueta opcional del código; uso del selector desde Ventas y prueba con lector físico.
- **Decisiones pendientes:** Vinculación futura de códigos con variantes; no se ha implementado stock por color.


Un producto podrá tener más de un código de barras. Esto cubre, entre otros casos, el mismo artículo comprado en lugares diferentes con códigos distintos.

No se guardarán todos los códigos en un único texto dentro de `Product`. Se utilizará una relación conceptual:

```text
Product
   ↓
ProductBarcode
--------------
id
productId
code
label       opcional
active
```

Ejemplo actual:

```text
Producto: Caja organizadora mediana

7790000000110 → Código del proveedor A
7790000000127 → Código del proveedor B
```

Todos los códigos permiten encontrar el mismo producto y comparten su precio y stock.

Cada código debe ser único dentro de Stockizi para evitar que un escaneo encuentre dos productos diferentes.

Implementación actual: `product_codes` relaciona `product_id` con códigos de texto de hasta 100 caracteres. Conserva letras y ceros iniciales; recorta espacios de los extremos y distingue mayúsculas/minúsculas. No exige formato EAN ni convierte códigos a números. El campo descriptivo `label` queda pendiente.

En la ficha de un producto ya guardado, **Códigos** permite agregar y quitar. Cada operación se guarda inmediatamente, separada del botón Guardar de la ficha; no se abre con cambios pendientes. Quitar pide una segunda confirmación y desactiva la asociación sin borrar el producto ni alterar stock/precio. Un código quitado puede volver a asignarse explícitamente; la asociación anterior se conserva inactiva. Esto no constituye todavía auditoría de empleados ni de fecha/motivo de retiro.

Un índice único de códigos activos impide compartir código entre dos productos, incluso con solicitudes simultáneas. Repetir un alta para el mismo producto devuelve la asociación existente. Tras un fallo incierto, consultar otra vez antes de seguir. **Buscar código** (o Enter en ese campo) consulta toda la base y selecciona el producto, limpiando filtros de nombre y rubro. Nombre/rubro siguen buscando solo entre productos cargados. No se reemplaza un borrador sin guardar. La conexión con Nueva venta y la prueba con lector físico quedan pendientes.

El alcance inicial no manejará stock separado por color o presentación. Esa posibilidad queda registrada como idea futura mediante variantes de producto.

#### 8.4. Rubros, categorías y búsqueda visual

- **Implementado actualmente:** Rubros/subcategorías propios y renombrables; clasificación opcional por ID y filtros locales combinados; sin borrar ni mover categorías.
- **Acordado, falta implementar:** No hay cambios adicionales a nombres propios ya implementados.
- **Planificado:** Búsqueda visual por foto y mejora visual inspirada en StockFácil.
- **Decisiones pendientes:** Ampliaciones de jerarquía, eliminación/traslado y paginación de listas de categorías si el volumen lo requiere.


El usuario crea y renombra sus propios rubros. No vienen definidos por el programa. Ejemplos posibles:

```text
Repostería
Papelería
Cotillón
```

Se utiliza una entidad separada para no repetir el nombre del rubro dentro de cada producto. El modelo ampliado propuesto inicialmente es:

```text
Category
--------
id
name
parentId    opcional
active
createdAt
updatedAt
```

La implementación SQL actual separa `categories` (rubros) y `subcategories` (subcategorías, con `category_id` como padre), manteniendo un nivel de profundidad. Los campos active/createdAt/updatedAt del modelo ampliado siguen pendientes. Por ejemplo:

```text
Cotillón
├── Globos
├── Velas
└── Decoración
```

La vista conectada permite crear y renombrar ambos nombres, sin listas predefinidas, mediante Administrar rubros. Rubro y subcategoría son opcionales; los productos anteriores quedan Sin rubro hasta asignarlos. Renombrar conserva el ID y las relaciones. La base impide asignar una subcategoría de otro rubro mediante una clave foránea compuesta. No permite nombres duplicados ignorando mayúsculas dentro del mismo nivel y rubro (conserva diferencias de tildes). Las mismas subcategorías pueden existir en rubros distintos. Reintentar un alta con el mismo nombre recupera la existente; renombrar exige el nombre original para no pisar cambios simultáneos. No hay traslado ni eliminación.

Los filtros por nombre, rubro y subcategoría se combinan sobre los productos cargados. Si quedan páginas, la pantalla avisa; todavía no es una búsqueda de toda la base. Cambiar el rubro limpia la subcategoría del borrador para evitar vínculos cruzados. Un fallo de consulta de rubros deshabilita su edición/filtro y muestra el error, sin borrar clasificaciones guardadas ni impedir consultar precios.

Distribución acordada para escritorio: catálogo y filtros arriba, con desplazamiento propio de la lista; formulario compacto siempre visible abajo. En pantallas pequeñas se permite desplazar la página para mantener accesibles todos los campos.

La sección `Productos` permitirá:

* Elegir un rubro.
* Buscar por parte del nombre.
* Buscar por cualquiera de sus códigos.
* Ver resultados con nombre, foto, precio y stock.
* Abrir rápidamente el producto para modificar precio u otros datos.

La sección `Nueva venta` reutilizará la misma búsqueda rápida. Además del lector de código de barras, el empleado podrá elegir rubro y reconocer el producto por nombre y foto. La presentación visual debe priorizar velocidad y botones fáciles de seleccionar.

---

### 9. Precio de venta

- **Implementado actualmente:** Costo mantiene markup y recalcula venta; venta manual recalcula markup; costo cero da markup nulo. Se redondea a centavos, no a múltiplos comerciales. Pantalla/API/PostgreSQL rechazan venta igual o menor al costo; el usuario confirmó 007 y sus controles.
- **Acordado, falta implementar:** Redondeo comercial y aplicación en Compras siguen futuros; la validación estricta ya está implementada.
- **Planificado:** Aplicar este cálculo a Compras con revisión antes de confirmar y redondeo comercial opcional.
- **Decisiones pendientes:** Excepciones durante Ventas, descuentos y autorización: postergadas, no aprobadas.


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

Regla acordada el 16/09/2026 e implementada ahora en pantalla y API: venta estrictamente mayor que costo. Se muestra error y se bloquea Guardar/Enter si queda igual o por debajo, sin aumentar automáticamente el precio. pricing.js compara `sale <= cost`; costo cero exige venta positiva. Un porcentaje positivo muy pequeño puede redondear a igualdad y también se rechaza. Las fichas anteriores se pueden leer sin corregir automáticamente; editar exige resolver el precio inválido. La migración 007 agrega CHECK (sale_price > cost_price) validando toda la tabla y luego sustituye la restricción antigua, en una transacción. Si hay filas inválidas falla sin cambiar datos; ejecutar ROLLBACK y revisar. Las excepciones en Ventas siguen pendientes.

En el formulario conectado, cambiar el porcentaje calcula la venta sugerida redondeada a centavos mediante enteros en `pricing.js`. Regla corregida por pedido del usuario: cambiar costo mantiene el porcentaje disponible y recalcula la venta; cambiar venta manualmente recalcula el porcentaje. Se conserva el porcentaje al vaciar transitoriamente el costo mientras se escribe, sin permitir guardar datos inválidos. Con costo cero el porcentaje se deshabilita, se ingresa venta directamente y se guarda porcentaje nulo; si todavía no hay porcentaje, no se inventa uno para calcular una venta. Un porcentaje inválido conserva la venta anterior pero bloquea Guardar y Enter hasta corregir o cancelar. Se validan hasta diez dígitos enteros y dos decimales y los límites almacenados. La API sigue recibiendo costo y venta y deriva el porcentaje efectivo: por redondeo a centavos puede diferir del porcentaje sugerido escrito, especialmente en costos muy pequeños. No requiere nueva migración SQL.

Al crear o editar un producto, Stockizi calculará un precio de venta sugerido:

```text
salePrice = costPrice × (1 + markupPercentage / 100)
```

El precio sugerido podrá corregirse manualmente antes de guardar. También se permitirá modificar el precio aplicado durante una venta cuando el negocio lo necesite.

En el formulario de productos, editar manualmente el precio de venta actualiza el porcentaje sobre costo: `((salePrice - costPrice) / costPrice) × 100`. Por ejemplo, costo $1.220 y venta $1.900 muestran aproximadamente 55,74 %. El porcentaje se muestra con dos decimales sin recalcular ni alterar el precio manual. Con costo cero este porcentaje no puede calcularse: el campo queda vacío para no mostrar un valor falso.

Para conservar la auditoría, una venta deberá distinguir entre:

```text
precio de lista
precio realmente aplicado
```

Queda por decidir qué permisos o motivo se exigirán para modificar manualmente un precio durante una venta.

---

### 10. Redondeo de precios

- **Implementado actualmente:** Solo redondeo técnico a centavos en pricing.js. No existe configuración de redondeo comercial.
- **Acordado, falta implementar:** Opcional, desactivado por defecto, un único múltiplo general sin excepciones por producto. Múltiplo más cercano; empate hacia arriba. El precio manual tiene prioridad y no se redondea.
- **Planificado:** Configuración visible para activar/desactivar y elegir múltiplo.
- **Decisiones pendientes:** Lista final de múltiplos ofrecidos y presentación de configuración. No se aplicará retroactivamente.


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

###### Acuerdo detallado de redondeo — 16/09/2026

- Orden: costo → porcentaje → redondeo al múltiplo más cercano si está activado → ajuste manual opcional. Venta manual recalcula porcentaje efectivo.
- Un único ajuste general, sin excepciones por producto, desactivado por defecto.
- Con múltiplo $100: $2.720 → $2.700; $2.778,10 → $2.800; empate $2.750 → $2.800.
- Activar/desactivar no cambia precios ya guardados. Solo afecta nuevos cálculos por alta, cambio de costo o porcentaje; ver y confirmar antes de guardar.
- Un precio manual, por ejemplo $2.750, se respeta exactamente; no se redondea otra vez.
- Si el resultado queda igual o debajo del costo, mostrar error y bloquear. Se descartó subir automáticamente al siguiente múltiplo como excepción.
- No confundir redondeo comercial opcional con guardar dinero a dos decimales, que ya existe.


---

### 11. Actualización automática de precios

- **Implementado actualmente:** Al editar costo o markup se recalcula el borrador de venta; se guarda solo al confirmar la ficha.
- **Acordado, falta implementar:** Al confirmar una compra se usa su último costo, se mantiene el porcentaje y se revisa la nueva venta antes de confirmar, permitiendo ajuste manual.
- **Planificado:** Integración del cálculo con el formulario de compra.
- **Decisiones pendientes:** Recalcular costos/precios tras corregir compras antiguas o con compras posteriores: no decidido.


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

### 12. Precio mayorista

- **Implementado actualmente:** Sin campos ni cálculo mayorista.
- **Acordado, falta implementar:** Sin nuevas decisiones específicas en esta revisión.
- **Planificado:** Precio y cantidad mínima configurables por producto según el ejemplo.
- **Decisiones pendientes:** Aplicación por unidad, combinación con descuentos/redondeo y permisos antes de implementarlo.


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

### 13. Distribuidores

- **Implementado actualmente:** Sin tablas, pantalla ni API de proveedores.
- **Acordado, falta implementar:** Un producto puede tener cero, uno o varios proveedores sin duplicar stock/precio; se puede cargar sin proveedor y asociarlo después.
- **Planificado:** Ficha sencilla y búsqueda de productos por distribuidor; cuenta del proveedor con deuda/saldo a favor.
- **Decisiones pendientes:** Detalles de vínculo, costos específicos por proveedor y asociación automática al comprar, no acordados.


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

###### Cuenta del proveedor: deudas y saldos a favor — acuerdo 16/09/2026

Una compra puede dejar deuda. Un pago excesivo o una corrección que reduzca lo comprado después de pagarlo pueden originar saldo a favor con el proveedor. Advertir antes de confirmar un pago mayor que la deuda, sin ocultar que el dinero realmente salió.

En una compra posterior mostrar el saldo disponible y preguntar si se quiere usar. Aplicar $3.000 de $5.000 deja $2.000; conservar origen y destino de la aplicación e impedir reutilizar lo consumido. No registrar otra salida de caja por usar ese saldo. Si devuelve dinero, el reintegro real requiere su registro: la corrección no lo produce automáticamente. El flujo detallado del reintegro aún se decidirá.


---

### 14. Actualización masiva desde distribuidor

- **Implementado actualmente:** Sin actualización masiva.
- **Acordado, falta implementar:** Una actualización masiva será una acción separada con confirmación; activar redondeo no modifica precios existentes.
- **Planificado:** Seleccionar varios productos y aumentar por monto o porcentaje.
- **Decisiones pendientes:** Aplicación sobre costo o venta, alcance, vista previa, concurrencia y mecanismo de reversión.


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

### 16. Compras

- **Implementado actualmente:** Sin Compras. El alta con stock inicial NO es una compra ni registra proveedor o pago.
- **Acordado, falta implementar:** Compra sin proveedor permitida; asignarlo después no duplica ni modifica stock/precios/pagos. Pago completo/parcial/pendiente; medios combinados; unidades manuales.
- **Planificado:** Formulario de compra y vínculos a productos, proveedores y pagos.
- **Decisiones pendientes:** Tratamiento de fechas retroactivas y efecto en costos de compras posteriores. Detalles técnicos de corrección, ver 17.


Contexto del negocio: normalmente se paga al proveedor en el momento. Decisión del 16/09/2026: Compras debe admitir compras pagadas completas, pagadas parcialmente y pendientes, con efectivo y transferencia combinables. Solo los importes realmente pagados son salidas de dinero.

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
supplierId       opcional; puede asignarse después
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

En el alcance inicial, las compras se cargarán directamente en la unidad base de stock del producto, aunque físicamente se hayan comprado bultos.

Ejemplos:

```text
1 bulto con 12 cajas → cargar quantity = 12 UNIT
1 bolsa de 25 kg     → cargar quantity = 25 KILOGRAM
```

La conversión automática de bultos a unidades queda como idea futura. De esta manera el modelo inicial es simple y el stock conserva una unidad coherente.

###### Recorrido acordado — 16/09/2026

Elegir proveedor (opcional) → agregar productos y cantidades base → revisar costos y precios de venta → indicar pagos efectivos y sus medios → confirmar.

- Se permite comprar sin proveedor y asignarlo posteriormente, sin recargar la operación ni modificar stock/precios/pagos por el mero cambio de proveedor.
- Si además queda deuda, mostrarla como **Pendiente de asignar proveedor**, con importe visible. Asignarlo vincula la deuda una sola vez.
- Estados funcionales: pagada completa, pagada parcialmente y pendiente de pago. Una compra puede combinar efectivo y transferencia; la diferencia no pagada queda pendiente.
- Ejemplo: compra $50.000, pago $20.000 en efectivo y $10.000 por transferencia: deuda $20.000; salida física $20.000, transferencia $10.000.
- Al confirmar se actualiza el costo del producto con el costo de la última compra. Se mantiene el porcentaje para calcular venta y se muestra antes de confirmar, permitiendo precio manual.
- Por ahora se ingresan unidades manualmente: dos bultos de doce se cargan como 24 UNIT. Automatizar bultos queda futuro (41.2).


---

### 17. Qué sucede cuando se registra una compra

- **Implementado actualmente:** Sin confirmación ni corrección de compras. Stock inicial no sustituye este flujo.
- **Acordado, falta implementar:** Confirmar aumenta stock, actualiza último costo y registra compra/pagos/deuda sin doble salida. Correcciones con vista previa, motivo e historial; ajustar diferencia de stock sin sobrescribir el saldo actual ni borrar pagos.
- **Planificado:** Implementación transaccional del recorrido y consulta de correcciones.
- **Decisiones pendientes:** Permisos, cajas cerradas, compras posteriores, devolución efectiva de dinero y corrección de pagos erróneos; no asumir reglas.


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
4. Registra los pagos efectivamente realizados y deja el resto pendiente.
5. Registra una única salida por cada pago y su medio; si no hay pago, no hay salida.
6. Conserva el historial del costo.
```

###### Correcciones de compras — acuerdo 16/09/2026

Se permite corregir una compra confirmada con motivo breve y vista previa de cambios en cantidad/stock, total y saldo. Conservar el original y el registro de la corrección.

Ejemplo: se compraron 12 cajas a $1.000 pero se cargaron 24 ($24.000). Corregir a 12 reduce el total a $12.000 y resta las 12 cajas cargadas de más, sin reemplazar el stock actual porque pudo haber ventas intermedias.

- Si no hubo pago, la deuda baja al nuevo total.
- Si realmente se pagaron $24.000, no borrar ese pago ni inventar devolución: quedan $12.000 a favor hasta aplicarlos o registrar un reintegro real.
- Mostrar el impacto antes de confirmar y evitar duplicar movimientos o pagos.
- Queda pendiente cómo tratar costo/venta actuales si hubo compras posteriores, precios modificados, cajas cerradas o una corrección de dinero mal cargado. Estas reglas no se resolvieron al aprobar la corrección de cantidades.


---

### 18. Historial de costos

- **Implementado actualmente:** Solo costo actual; no existe historial de cambios de costo. stock_movements no contiene costos.
- **Acordado, falta implementar:** Historial consultable dentro de la ficha, con anterior/nuevo, fecha y origen compra o edición manual. Conservar valores de compras anteriores.
- **Planificado:** Vista opcional que no ocupa permanentemente la ficha; costos históricos para reportes.
- **Decisiones pendientes:** Identidad del autor al implementar usuarios; cambios retroactivos y efecto en reportes.


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

###### Consulta en la ficha — acuerdo 16/09/2026

Apartado **Historial de costos**, abierto cuando se necesita, sin ocupar permanentemente la pantalla principal. Guarda valor anterior/nuevo, fecha y origen (compra o edición manual), no solo cambios provenientes de Compras. Ejemplo: 10/09 costo $1.000 por compra; 16/09 pasó a $1.200 por edición manual. Sirve para entender aumentos o detectar errores; no revierte valores automáticamente. Identificar al empleado dependerá de implementar usuarios.


---

### 19. Ventas

- **Implementado actualmente:** Nueva venta es una sección informativa; no hay ventas ni tablas Sale/SaleItem.
- **Acordado, falta implementar:** Venta con efectivo y transferencia combinados; venta fiada genera deuda y descuenta stock, no cobra automáticamente.
- **Planificado:** Carrito, selección reutilizable, cambios de precio por renglón, artículo rápido, descuentos y recargos.
- **Decisiones pendientes:** Artículo rápido, costo asociado, devoluciones, promociones y límites/permisos. Vender al costo o por debajo se decidirá después.


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
listUnitPrice
unitPrice
subtotal
priceEntryMode
```

* `quantity`: cantidad expresada en la unidad principal del producto.
* `listUnitPrice`: precio de lista por unidad principal al momento de vender.
* `unitPrice`: precio por unidad principal realmente aplicado.
* `subtotal`: importe final de ese renglón.
* `priceEntryMode`: indica si la operación se inició ingresando cantidad o importe.

También es recomendable guardar el costo al momento de la venta para poder calcular rentabilidad histórica correctamente:

```text
unitCost
```

#### 19.1. Venta por peso

- **Implementado actualmente:** Unidades fraccionarias en Productos, no venta por peso.
- **Acordado, falta implementar:** Sin cambios nuevos a lo ya previsto: cantidad o importe, stock en unidad base.
- **Planificado:** Ingreso por gramos/kilos o importe con campos relacionados.
- **Decisiones pendientes:** Redondeo entre cantidad e importe, precisión y manejo de residuales antes de ventas reales.


Para un producto cuya unidad sea `KILOGRAM`, el precio de venta se interpreta como precio por kilogramo.

Al seleccionar el producto durante una venta, la interfaz permitirá ingresar:

```text
gramos o kilogramos
importe total
```

Los campos estarán relacionados. Si se ingresa la cantidad, Stockizi calcula el importe:

```text
Precio por kg: $4.000
Cantidad: 300 g = 0,300 kg
Importe: $1.200
```

Si se ingresa el importe, Stockizi calcula la cantidad correspondiente:

```text
Precio por kg: $4.000
Importe pedido: $1.000
Cantidad: 250 g = 0,250 kg
```

El stock siempre se descontará usando la unidad principal del producto. En el ejemplo anterior se descontará `0,250 kg`, aunque el usuario haya escrito `$1.000`.

La base de datos guardará la cantidad normalizada en kilogramos, el precio de lista, el precio aplicado y el subtotal. No será necesario guardar una existencia separada en gramos.

La misma idea podrá aplicarse posteriormente a metros y litros. Las reglas exactas de redondeo entre cantidad e importe deben definirse antes de implementar ventas reales.

---

### 20. Qué sucede cuando se hace una venta

- **Implementado actualmente:** Sin operaciones de venta o cobro.
- **Acordado, falta implementar:** Registrar venta, productos, pagos reales y deuda restante separadamente; cobro posterior no repite venta ni stock.
- **Planificado:** Confirmación atómica de venta/movimientos/pagos.
- **Decisiones pendientes:** Anulaciones, devoluciones, permisos y tratamiento de cierres.


Cuando se confirma una venta normal:

```text
1. Baja el stock.
2. Se registra la venta.
3. Se registran los productos vendidos.
4. Se registran los pagos efectivamente recibidos; puede quedar deuda.
5. Entra dinero si corresponde.
6. Aumentan las estadísticas.
7. Aparece en el historial.
```

#### 20.1. Venta sin stock disponible

- **Implementado actualmente:** products admite stock negativo; la API no vende ni ajusta stock.
- **Acordado, falta implementar:** Permitir venta sin stock suficiente con advertencia, registrar faltante y no llevarlo a cero silenciosamente.
- **Planificado:** Alertas y tareas de regularización.
- **Decisiones pendientes:** Qué roles pueden confirmar la advertencia.


Stockizi permitirá confirmar una venta aunque no haya stock suficiente. La operación no se bloqueará.

Ejemplo:

```text
Stock actual: 0 un.
Cantidad vendida: 1 un.
Stock resultante: -1 un.
```

Antes de confirmar, la interfaz debe advertir claramente que la venta dejará stock negativo. Si el usuario continúa:

```text
1. Se confirma la venta normalmente.
2. El stock queda negativo.
3. Se registra el movimiento que produjo el faltante.
4. El producto aparece en alertas y tareas de regularización.
```

El stock negativo no debe corregirse silenciosamente ni convertirse automáticamente en cero, porque eso ocultaría la diferencia real. Cuando se reponga o ajuste el producto, el historial debe permitir entender cómo volvió a una cantidad correcta.

Queda por decidir si cualquier usuario podrá confirmar la advertencia o si ciertos roles necesitarán permiso especial.

---

### 21. Cuenta corriente

- **Implementado actualmente:** Sin Clientes ni cuenta corriente; el Excel del negocio no se importó.
- **Acordado, falta implementar:** Clientes → Deudas y saldos a favor. Pagos parciales al total, en efectivo/transferencia; aplicación interna a deudas más antiguas sin elegir compras. Excedentes generan saldo a favor consumible.
- **Planificado:** Historial de ventas, cobros, aplicaciones y saldo; integración con Ventas.
- **Decisiones pendientes:** Campos de cliente, importación del Excel existente, devoluciones de saldo, corrección/anulación de cobros y permisos.


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

###### Clientes → Deudas y saldos a favor — acuerdo 16/09/2026

El negocio lleva actualmente deudas en Excel. Se acordó centralizar su seguimiento en Clientes; importar el Excel es una posibilidad por evaluar, no una tarea implementada ni autorizada automáticamente.

- Una venta fiada registra venta y descuento de stock; no suma dinero a caja hasta cobrar.
- El usuario cobra sobre el total del cliente sin elegir una compra. Internamente se aplicará a las deudas más antiguas y se conservarán los vínculos.
- Admite pagos parciales por efectivo o transferencia. Si debe $10.000 y entrega $4.000, quedan $6.000; la transferencia no entra al efectivo físico.
- Cobrar mañana una venta de hoy no crea una segunda venta ni descuenta stock de nuevo.
- Si paga de más, queda saldo a favor del cliente. Distinguir **Debe $6.000** de **Tiene $2.000 a favor**, no mostrar una deuda negativa sin explicación.
- Usar saldo a favor reduce lo disponible y registra su aplicación, sin duplicar cobro; no puede gastarse dos veces.
- Conservar compras/ventas, cobros y aplicaciones que explican el saldo, no reemplazar simplemente el número.
- Confirmación de uso del saldo del cliente, devoluciones, anulaciones y permisos siguen por precisar; no extrapolar automáticamente todas las reglas del proveedor.


---

### 22. Presupuestos

- **Implementado actualmente:** Sin presupuestos.
- **Acordado, falta implementar:** Sin nuevas decisiones específicas en esta revisión.
- **Planificado:** Presupuesto sin stock/caja/venta hasta conversión, reutilizable e histórico.
- **Decisiones pendientes:** Vigencia, conversión parcial, actualización de precios y permisos.


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

### 23. Payment

- **Implementado actualmente:** Sin registros de pagos/cobros.
- **Acordado, falta implementar:** Venta y compra admiten efectivo+transferencia, incluso pagos parciales; registrar cada importe una vez. Saldo a favor se consume sin generar nuevo dinero.
- **Planificado:** Otros medios CARD/QR/OTHER y vínculos transaccionales según el modelo conceptual.
- **Decisiones pendientes:** Corrección de medio de pago en ventas, permisos y cajas cerradas. No confundir uso de saldo con un nuevo pago en efectivo.


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

### 24. Caja

- **Implementado actualmente:** Solo sección informativa Caja.
- **Acordado, falta implementar:** Separar efectivo y transferencias; únicamente efectivo cambia billetes del cajón.
- **Planificado:** Apertura, cierre, cajas anteriores y movimientos por medio.
- **Decisiones pendientes:** Permisos, turnos, varias cajas y operaciones sobre cajas cerradas.


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

### 25. CashRegister

- **Implementado actualmente:** Sin entidad CashRegister.
- **Acordado, falta implementar:** Separar dinero esperado de contado y mostrar diferencia.
- **Planificado:** Modelo de apertura/cierre debajo.
- **Decisiones pendientes:** Alcance por terminal/usuario y manejo de diferencias.


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

### 26. CashMovement

- **Implementado actualmente:** Sin CashMovement. stock_movements es movimiento de mercadería, no dinero.
- **Acordado, falta implementar:** Un pago implica una única salida/entrada según medio; ni compra y gasto duplicados ni otro cobro al consumir saldo a favor.
- **Planificado:** Movimientos de caja con vínculo a su operación, tipos y motivos.
- **Decisiones pendientes:** Operaciones retroactivas, ajustes, reversión y permisos.


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

### 27. Diferencia entre ventas y caja física

- **Implementado actualmente:** Sin cálculo de caja.
- **Acordado, falta implementar:** Transferencia no aumenta efectivo físico. Ventas y cobros son conceptos separados.
- **Planificado:** Vista desglosada por medios.
- **Decisiones pendientes:** Detalles de liquidación de tarjetas/Posnet y presentación.


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

### 28. Resumen diario

- **Implementado actualmente:** Sin resumen diario.
- **Acordado, falta implementar:** Separar ventas realizadas, cobros recibidos y deuda pendiente; evitar contar de nuevo ventas cobradas otro día.
- **Planificado:** Resumen y ejemplos debajo; inventario a costo diferenciado de resultado bruto.
- **Decisiones pendientes:** Criterios de fecha, rentabilidad y efectos de correcciones/cierres.


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

El ejemplo siguiente supone ventas cobradas en ese período. Con fiados y cobros de días anteriores, el resumen tendrá ventas, cobros y pendientes separados; no usará el desglose de cobros como si siempre fuera el total de ventas.

---

### 29. Gastos

- **Implementado actualmente:** Sin registro de gastos.
- **Acordado, falta implementar:** Separar mercadería (Compras) de luz/alquiler/limpieza (Gastos); el pago sale una sola vez del medio elegido.
- **Planificado:** Registro PC/celular y clasificación de gastos.
- **Decisiones pendientes:** Categorías, permisos y correcciones; no inferir el concepto solo por el proveedor.


Queremos registrar gastos como:

* Luz.
* Gas.
* Alquiler y limpieza.
* Otros gastos del negocio.

Los gastos podrán consultarse desde PC y también desde el celular.

Los gastos deben afectar correctamente la caja/dinero cuando corresponda, pero también deben distinguirse de retiros o reservas.

La mercadería se registra en Compras, no se vuelve a cargar como gasto. Su pago produce una sola salida por medio elegido. Los servicios se clasifican por concepto; la palabra proveedor por sí sola no define si algo es compra de mercadería o gasto.

---

### 30. Retiro / dinero para reposición

- **Implementado actualmente:** Sin retiros ni reservas.
- **Acordado, falta implementar:** Sin nuevas decisiones específicas en esta revisión.
- **Planificado:** Separar reposición/inversión sin falsear gastos o ganancia.
- **Decisiones pendientes:** Ubicación del dinero reservado, transferencias internas, permisos y reversión.


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

### 31. Estadísticas

- **Implementado actualmente:** Sin estadísticas comerciales.
- **Acordado, falta implementar:** Distinguir venta de cobro: una venta fiada genera deuda; cobrarla después no es otra venta.
- **Planificado:** Reportes de ventas, cobros, costos históricos, inventario a costo y rentabilidad.
- **Decisiones pendientes:** Fórmulas/rangos definitivos; resultado bruto no equivale al resultado después de gastos.


Cuando se hace una venta:

```text
ventas ↑
productos vendidos ↑
cobros ↑ solo por dinero efectivamente recibido
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

### 32. ARCA / Posnet

- **Implementado actualmente:** Sin integración ARCA/Posnet.
- **Acordado, falta implementar:** Sin nuevas decisiones fiscales ni técnicas en esta revisión.
- **Planificado:** Información para el flujo existente del negocio, sin repetir productos en Payment.
- **Decisiones pendientes:** Alcance y requisitos de exportación/integración antes de implementar.


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

### 15. Administración desde celular

- **Implementado actualmente:** Sin interfaz móvil. API únicamente local.
- **Acordado, falta implementar:** Backups quedan pendientes de definir junto con almacenamiento; ver C.
- **Planificado:** Web privada de administración con las acciones detalladas abajo.
- **Decisiones pendientes:** Alojamiento, autenticación, permisos, conexión y acceso desde celular.


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
* Crear recordatorios para actualizar productos o precios.
* Consultar y completar tareas pendientes.
* Ver productos sin foto y agregarles una imagen usando la cámara o galería.
* Ver stock.
* Ver productos con stock bajo.
* Ver caja.
* Registrar gastos.
* Consultar ventas.
* Consultar información del negocio.

#### 15.1. Recordatorios y tareas pendientes

- **Implementado actualmente:** Sin tareas ni notificaciones.
- **Acordado, falta implementar:** Sin nuevas decisiones específicas en esta revisión.
- **Planificado:** Bandeja de tareas PC/celular y tipos/estados conceptuales conservados.
- **Decisiones pendientes:** Notificaciones automáticas: tecnología, permisos y horarios.


Stockizi tendrá una bandeja de tareas visible desde el celular y desde el inicio de la aplicación de escritorio.

Casos iniciales:

```text
Recordar actualizar precios de un distribuidor
Recordar revisar uno o varios productos
Completar fotos faltantes
Revisar productos con stock bajo
```

Una tarea podrá ser general o estar relacionada con un producto o distribuidor. Estructura conceptual inicial:

```text
Task
----
id
type
title
note
productId       opcional
supplierId      opcional
dueAt           opcional
status
createdAt
completedAt     opcional
createdByUserId
```

Tipos iniciales posibles:

```text
PRODUCT_UPDATE
PRICE_UPDATE
MISSING_PHOTO
LOW_STOCK_REVIEW
OTHER
```

Estados iniciales:

```text
PENDING
COMPLETED
CANCELLED
```

Primero se implementará la bandeja de tareas dentro de Stockizi. Las notificaciones automáticas del teléfono se evaluarán más adelante, porque requieren permisos, horarios y una tecnología de notificaciones que todavía no fue elegida.

<a id="pendientes"></a>

## C. Decisiones pendientes e ideas futuras

### 40. Decisiones pendientes actualizadas al 16/09/2026

#### Producto, costos y precios

- Ya están acordados varios proveedores opcionales por producto; falta el esquema de asociaciones, la posible conservación de costos por proveedor y decidir si comprar genera asociaciones automáticamente.
- Ya está acordado el orden costo → porcentaje → redondeo opcional → manual, y que el precio de catálogo debe superar el costo. Pantalla/API/PostgreSQL aplican precio estricto; 007 y controles confirmados por el usuario. El redondeo comercial todavía no existe.
- No confundir markup sobre costo con margen sobre venta. Sigue pendiente definir cómo calcular/presentar margen de reportes y si se persiste.
- Movimientos de stock: INITIAL existe; faltan compras, ventas, ajustes y pérdidas, con sus permisos y auditoría.
- Costo de última compra acordado; efectos de corregir compras antiguas, fecha retroactiva y compras posteriores siguen sin decidir.
- Depósitos, sucursales y stock por ubicación, así como variantes por color, siguen futuros.
- Desactivar productos está acordado, pero falta definir su interacción con códigos y permisos. No inventar nuevas reglas al implementarlo.

#### Operaciones comerciales

- Ventas: cantidad/importe para peso, redondeo de cantidades y residuales; artículo rápido, costo y stock asociado; descuentos/recargos y promociones. Promociones pueden esperar.
- Venta al costo o por debajo durante una operación comercial: el usuario postergó la decisión. No está aprobado permitirla por autorización de administrador ni bloquearla siempre en Ventas; la regla estricta confirmada corresponde al catálogo.
- Cuenta corriente: registrar pagos parciales al total y aplicarlos a deudas antiguas está acordado. Faltan campos de clientes, importación del Excel de deudas, devoluciones, anulaciones y corrección de cobros.
- Proveedor: pagos combinados, deudas, saldos a favor y confirmación antes de usarlos están acordados. Falta el flujo de devolución real del saldo y tratamiento de pagos mal cargados.
- Compras: correcciones con motivo, vista previa e historial están acordadas. Faltan permisos, compras posteriores, costo/venta resultante, fechas y cajas cerradas.
- Corrección del medio de pago de ventas desde historial, conservando venta/stock: necesidad identificada, reglas de permisos, motivo y cajas cerradas aún pendientes.
- Las relaciones físicas de Payment con ventas, compras y aplicaciones de saldo deben diseñarse: las reglas de negocio acordadas no constituyen todavía un esquema SQL.
- Transición: decidir reemplazo/convivencia con StockFácil, tareas indispensables, importación de exportación completa y correspondencias. Los hallazgos de videos y Excel permanecen en 5.3–5.4.
- ARCA/Posnet: requisitos concretos e integración/exportación por diseñar, sin asumir que ya existe facturación fiscal.

#### Arquitectura, acceso y almacenamiento

- Framework definitivo de API y uso o no de Prisma; actualmente hay HTTP nativo y pg funcionales.
- Alojamiento de API, PostgreSQL y fotos; autenticación, autorización, HTTPS, recuperación de acceso y conexión interrumpida.
- Límites, formatos, compresión y privacidad de fotos.
- Tecnología, permisos y horarios de notificaciones móviles.
- Los permisos para confirmar stock insuficiente siguen pendientes aunque permitir la venta con advertencia sea requisito acordado.

### Backups: pendientes para la etapa de almacenamiento

- **Implementado actualmente:** datos persistidos en PostgreSQL; no hay backups automáticos ni restauración integrada. El commit de Git conserva código/documentación, no los productos/ventas de la base.
- **Acordado, falta implementar:** respaldo al cerrar y también durante el uso; conservar varias copias y mostrar fecha del último éxito/aviso de fallos. Incluir todos los datos comerciales existentes cuando se implementen y las fotos cuando existan. Una interrupción brusca puede impedir el backup de cierre.
- **Planificado:** resolver esta función al crear/definir almacenamiento, como pidió el usuario. Incluir una copia fuera de la computadora; no solo otra carpeta en el mismo disco.
- **Decisiones pendientes:** destino (disco externo/nube), frecuencia, retención, cifrado, credenciales, permisos, espacio, comprobación y restauración; coordinación cuando cierren varias PCs/celular y comportamiento si un backup demora o falla. No instalar, publicar ni programar una automatización por esta nota.

### 41. Ideas futuras

Estas ideas pueden aportar valor cuando el negocio o el sistema crezcan, pero quedan fuera del alcance actual para evitar complejidad prematura.

#### 41.1. Variantes con stock propio

- **Implementado actualmente:** No existen variantes; varios códigos identifican el mismo producto y stock.
- **Acordado, falta implementar:** No hay un compromiso de implementación inmediata.
- **Planificado:** Stock por color/presentación para una etapa futura, como pidió el usuario.
- **Decisiones pendientes:** Modelo, precio compartido o por variante y asociación de códigos.

Permitir que un producto comparta nombre y precio general, pero tenga variantes con stock separado.

Ejemplo:

```text
Caja organizadora mediana
├── Verde    → 5 unidades
├── Azul     → 8 unidades
└── Celeste  → 7 unidades
```

Una estructura futura podría ser:

```text
Product
   ↓
ProductVariant
--------------
id
productId
name o attributes
stock
active
```

Los códigos de barras podrían asociarse a una variante concreta. Antes de implementarlo habrá que decidir si el precio también puede variar por color o presentación.

#### 41.2. Conversión de bultos en compras

- **Implementado actualmente:** Compras no implementadas; productos tienen unidad base.
- **Acordado, falta implementar:** Al construir Compras se ingresarán manualmente las unidades, sin conversión automática inicial.
- **Planificado:** El usuario reafirmó el 16/09/2026 su interés en ingresar bultos y convertirlos más adelante.
- **Decisiones pendientes:** Presentaciones, factores de conversión, redondeo y cambios del contenido de un bulto.

Permitir registrar la presentación de compra y convertirla automáticamente a la unidad base de stock.

Ejemplos:

```text
2 bultos × 12 unidades = 24 UNIT
3 bolsas × 25 kg       = 75 KILOGRAM
```

Hasta que esta función sea necesaria, el usuario cargará directamente `24 UNIT` o `75 KILOGRAM` en la compra.

<a id="arquitectura"></a>

## D. Arquitectura, archivos y mantenimiento

### 3. Tecnologías actuales y futuras

Implementadas: Node.js, npm, Electron, HTML, CSS, JavaScript, Git/GitHub, API HTTP nativa de Node, pg y PostgreSQL local. `package.json` declara Electron ^43.4.1 como dependencia de desarrollo y pg ^8.23.0 como dependencia.

Planificadas: React, TypeScript, interfaz móvil, almacenamiento central de fotos y despliegue multi-PC. PostgreSQL ya existe localmente; lo pendiente es su operación compartida segura. Framework definitivo de API y posible Prisma siguen por decidir.

La migración a React/TypeScript será progresiva y explicada. No recrear el proyecto ni reinstalar Electron por instrucciones antiguas del historial.

### 4. Mapa actual de archivos y responsabilidades

Carpeta de trabajo: `C:\Users\ezema\Desktop\stockizi`. Rama en esta revisión: `feature/productos-iniciales`.

| Archivo/carpeta | Responsabilidad |
| --- | --- |
| package.json / package-lock.json | Dependencias y comandos start, api y test |
| main.js | Ventana Electron y operaciones IPC autorizadas |
| preload.js | Puente limitado: listar/crear/guardar productos, rubros y códigos |
| index.html / styles.css | Estructura de pantalla y presentación |
| navigation.js | Inicio, Nueva venta, Productos y Caja; no recrea el borrador |
| catalog.js | Catálogo persistente, selección, borrador, alta, edición y paginación |
| pricing.js | Validación exacta y cálculos con centavos enteros |
| category-ui.js / codes-ui.js | Administración de rubros/códigos y búsqueda por código |
| api-client.js | Peticiones locales fijas y validación de respuestas; sin credenciales de base en pantalla |
| server/index.js / database.js | Inicio local y conexiones PostgreSQL desde entorno privado |
| server/app.js | Rutas y validación HTTP de productos, clasificación y códigos |
| server/products.js / categories.js / codes.js | Consultas SQL parametrizadas |
| database/001–006*.sql | Evolución real de estructura/permisos; no repetir migraciones aplicadas |
| database/README.md / server/README.md | Guías técnicas con pasos e hitos históricos; contrastar estado con A |
| exit-guard.js / exit-dialog.js | Estado de borradores y aviso nativo de salida |
| scripts/check-exit-guard.cjs | Cierre/recarga y guardado pendiente en verificación aislada |
| tests/*.test.cjs | 68 pruebas actuales, incluidas las del prototipo anterior |
| scripts/verify-initial-stock.cjs | Integración opcional en PostgreSQL temporal aislado; no lee .env |
| scripts/check-categories.cjs / check-codes.cjs | Extensiones de esa prueba y recorrido Electron |
| renderer.js | Prototipo local conservado, NO cargado por index.html |
| stockizi.md | Archivo vacío conservado; no es un documento maestro alternativo |
| readme.md | Este documento maestro |
| .gitignore / .env.example | Exclusiones y plantilla pública de entorno sin contraseña |
| .env | Configuración privada local, ignorada por Git; no compartir |
| DESARROLLO.md | Acuerdos didácticos locales ignorados por Git |
| apuntes/ | Nuevos archivos ignorados; algunos apuntes anteriores siguen versionados |
| node_modules/ | Dependencias locales, ignoradas por Git |

Recorrido activo: index.html carga pricing.js, category-ui.js, codes-ui.js, catalog.js y navigation.js; catalog/diálogos → preload → main → api-client → API → PostgreSQL. No hay conexión directa del navegador a la base.

Comandos existentes:

- `npm start`: abre Electron.
- `npm run api`: mantiene la API local ejecutándose con .env.
- `npm test`: pruebas Node, sin abrir Electron ni modificar datos habituales.
- `node scripts/verify-initial-stock.cjs --electron`: prueba opcional aislada con PostgreSQL 18 y Playwright local; deja carpeta temporal de diagnóstico y detiene su servidor al finalizar. No se necesita para leer el README ni equivale a aplicar migraciones al usuario.

Las versiones Node v26.7.0 y npm 11.19.0 son el registro de instalación de la etapa anterior (conservado en E), no un chequeo nuevo de versiones ni una política de actualización.

### Correspondencia del modelo con SQL

- products: id, name, cost_price, sale_price, markup_percentage, unit, stock, active, created_at; 004 agrega creation_key/creation_payload; 005 agrega category_id/subcategory_id.
- stock_movements: solo INITIAL, cantidad/unidad/stock resultante/fecha; no historial de costos ni auditoría completa de ventas.
- categories/subcategories: IDs y nombres; subcategories tiene category_id. Sin active ni fechas en estas tablas.
- product_codes: id, product_id, code, active, created_at; no label ni fecha/motivo de retiro.
- No existen todavía tablas de clientes, proveedores, compras, ventas, pagos, cuenta corriente, cajas, gastos, fotos, tareas o usuarios de negocio.
- Los identificadores BIGINT y NUMERIC salen como texto en JSON para conservar precisión. El modelo conceptual usa camelCase; las columnas SQL usan snake_case.
- La unicidad de códigos activos distingue mayúsculas/minúsculas. Los nombres de rubro/subcategoría usan unicidad ignorando mayúsculas con pg_unicode_fast en PostgreSQL 18 UTF8; las tildes distinguen nombres.
- pricing.js rechaza igualdad. 003 se conserva sin cambios como historial; 007 reemplaza su CHECK y fue confirmada en la base habitual. check_product_prices.sql solo informa registros a revisar.

### 2. Arquitectura general prevista

Arquitectura objetivo planificada:

```text
🖥️ Aplicación PC                    📱 Web móvil privada
Electron + React/TypeScript             React/TypeScript
              │                           │
              └─────────────┬─────────────┘
                            ▼
                       API / backend
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
     Base de datos PostgreSQL     Almacenamiento de fotos
```

La PC y el celular deben trabajar con **los mismos datos**.

No queremos una base de datos diferente en cada computadora.

La API será la única puerta de acceso a los datos compartidos. Esto permitirá que:

* Se modifique un precio desde el celular.
* La PC vea el cambio.
* Se agregue un producto desde la PC.
* El celular lo vea.
* Se consulte stock desde el celular.
* Se consulten gastos/caja desde el celular.

---

### 33. Multi-PC

- **Implementado actualmente:** API en 127.0.0.1, una base local de desarrollo. No hay acceso multi-PC/celular operativo.
- **Acordado, falta implementar:** Compartir una única fuente de datos, no copias independientes por equipo.
- **Planificado:** Dos o tres PCs y administración móvil.
- **Decisiones pendientes:** Autenticación, HTTPS, alojamiento, conexión interrumpida y almacenamiento/backups.


Actualmente el negocio utiliza una computadora. Stockizi debe permitir trabajar con dos o tres computadoras y acceso administrativo desde el celular, compartiendo la misma información.

La idea final es:

```text
PC 1 ─────┐
          │
PC 2 ─────┼──── API ──── PostgreSQL
          │
PC 3 ─────┤
          │
Celular ──┘
```

Todos trabajan con la misma información.

Esto significa que NO queremos que cada PC tenga su propia base de datos independiente.

---

### 34. Seguridad / usuarios

- **Implementado actualmente:** Aislamiento Electron, validación de solicitudes y roles SQL reader/editor; NO usuarios de negocio ni login.
- **Acordado, falta implementar:** No se aprobó todavía una excepción de administrador para vender al costo o por debajo.
- **Planificado:** Usuarios y roles de negocio; respaldo y despliegue seguro.
- **Decisiones pendientes:** Autorizaciones, recuperación de acceso, permisos por operación y políticas de seguridad.


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

### 35. Flujo completo esperado

Este diagrama es arquitectura objetivo: únicamente productos y su stock inicial existen; compras/ventas/pagos/caja son futuros. Ninguna flecha implica que ya hay tablas u operaciones implementadas.

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

### 36. Objetivo de aprendizaje

El usuario tiene una base y quiere aprender programación mientras construimos el proyecto, priorizando una aplicación útil para el negocio. No es necesario que pueda escribir cada función desde cero para que el proyecto avance.

Los conceptos se explicarán sobre el código real cuando aparezcan, con profundidad proporcional a lo que necesite comprender:

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

Se calibrará lo que ya conoce para evitar repetir fundamentos innecesariamente. Los ejercicios y cambios pequeños se utilizarán cuando ayuden, sin convertir cada paso en una clase larga. La dinámica concreta se mantiene en `DESARROLLO.md`, archivo local ignorado por Git.

---

### 38. Uso del documento maestro

Este README es el documento maestro y el prototipo funcional de Stockizi. Su objetivo es conservar el contexto del proyecto para poder retomarlo, revisarlo y mejorarlo sin depender de la memoria de una conversación.

Debe diferenciar claramente:

```text
IMPLEMENTADO   → existe hoy en código; indicar qué se probó y dónde
ACORDADO, FALTA IMPLEMENTAR → comportamiento confirmado, aún ausente o distinto en código
PLANIFICADO    → alcance o etapa futura; no implica detalles ya decididos
PENDIENTE DE DECISIÓN → falta una elección funcional o técnica
EN CURSO       → etiqueta adicional de avance, no sustituye las anteriores
```

El documento es vivo: puede modificarse cuando cambie una decisión, se encuentre una solución mejor, se agregue o descarte una función o el código avance.

Reglas para mantenerlo útil:

* Registrar decisiones importantes y explicar su motivo.
* Mantener actualizado el punto exacto del desarrollo.
* No presentar una función planificada como si ya existiera.
* Revisar el impacto de una decisión en PC, celular, API y base de datos.
* Evitar convertirlo en una copia completa del código.
* Conservar los conceptos centrales del negocio aunque cambien las tecnologías.
* Evaluar en conjunto las decisiones que afecten la arquitectura, los datos o el funcionamiento real del negocio.

Las instrucciones didácticas pertenecen a la dinámica de aprendizaje y no deben mezclarse con la especificación funcional, salvo el objetivo general de aprender programación mientras se construye Stockizi.

---

### 39. Nombre oficial

El programa se llama:

**STOCKIZI**

Ese nombre debe utilizarse en el proyecto, interfaz y documentación.

<a id="historial"></a>

Actualización del 17/09/2026: el usuario confirmó 007, controles sin filas inválidas y funcionamiento. Se implementó la protección de cierre/recarga normal, comprobada con 68 pruebas unitarias y recorrido Electron/API/PostgreSQL aislado. Las notas anteriores que indican 007 pendiente o pérdida de borradores al cerrar quedan reemplazadas por el estado activo A/B; se conservan debajo como registro histórico. La protección no cubre caídas ni reemplaza backups.

## E. Historial de decisiones y avances

Este bloque conserva antecedentes, no instrucciones operativas. **No ejecutar migraciones por una indicación del material archivado.** El estado actual está en A y los acuerdos vigentes en B/C.

### Registro de reemplazos y aclaraciones

| Tema | Antecedente | Reemplazo o aclaración |
| --- | --- | --- |
| Venta al costo | Se permitía igualdad y aún se permite en el código | 16/09/2026: acordado exigir mayor que costo; implementación pendiente |
| Redondeo bajo costo | Se propuso subir automáticamente al siguiente múltiplo | 16/09/2026: propuesta rechazada; error y bloqueo, sin incremento automático |
| Redondeo por producto | Se propusieron excepciones individuales | 16/09/2026: rechazadas; una configuración general opcional, apagada por defecto |
| Cambio de costo | En una etapa se conservaba la venta manual al cambiar costo | Reemplazada antes de esta reorganización, ya vigente en a385b7c: conservar markup y recalcular venta; documentada en el hito de precios del 15/09. No se inventa hora exacta |
| Proveedor único | Product mostraba supplierId y relación por decidir | 16/09/2026: varios proveedores opcionales; modelo físico pendiente |
| Deudas | Pagos parciales a proveedores eran una posibilidad futura | 16/09/2026: compra completa/parcial/pendiente y medios combinados acordados |
| Clientes | Deudas llevadas en Excel | 16/09/2026: Clientes → Deudas y saldos a favor; aplicación interna a deudas antiguas; importación no decidida |
| Gastos | Lista genérica incluía Proveedores | 16/09/2026: separar mercadería de otros gastos y registrar cada pago una sola vez |
| Estadísticas | Ejemplo decía ingresos ↑ con toda venta | 16/09/2026: distinguir venta, cobro y deuda; no cobrar automáticamente ventas fiadas |
| Producto eliminado | Se hablaba de eliminar/desactivar sin resolver | 16/09/2026: desactivar/reactivar, conservar stock/historial y advertir existencias |
| Historial de costos | Basado en compras futuras | 16/09/2026: incluir edición manual, valores anterior/nuevo, fecha/origen y consulta en ficha |
| Correcciones de compra | Sin recorrido detallado | 16/09/2026: motivo, vista previa, diferencia de stock e historial; pagos reales no se borran |
| Saldos a favor | No detallados | 16/09/2026: clientes y proveedores; origen y uso registrados; lo consumido deja de estar disponible |
| Backups | Seguridad y respaldo genéricos | 16/09/2026: al cerrar y durante uso; múltiples copias/aviso; pendiente de almacenamiento |
| Instrucciones 004/005 | Pendientes repetidos en estados viejos | Superados por confirmaciones del usuario; no repetir |
| Instrucción 006 | Pendiente al respaldo a385b7c | 16/09/2026: usuario informa COMMIT; prueba manual de códigos aún por confirmar |
| Advertencia al cerrar | Se perdió del párrafo de estado activo al sustituirlo | 16/09/2026: restaurada en A; la limitación nunca se resolvió en código |

Las decisiones del 16/09/2026 se registran con la fecha disponible en esta conversación, sin atribuir horarios ni fechas anteriores no comprobadas. Las verificaciones antiguas se conservan abajo con su contexto original.

### Advertencia recuperada del historial Git

Texto que estaba en 8541e86 y fue retirado al reemplazar un párrafo, aunque seguía siendo válido:

> La navegación conserva el borrador, pero cerrar o recargar la ventana aún puede perder cambios no guardados.

### Apartados anteriores completos, preservados como referencia

Los antiguos apartados 3, 4, 37 y 40 se guardan íntegros a continuación. Sus listas de archivos, conteos de pruebas, pendientes y referencias a “actual” describen etapas anteriores; pueden contradecir deliberadamente el presente porque documentan cómo fue cambiando. No tienen prioridad sobre A/B/C/D.


<details>
<summary>Archivo histórico: sección 3, tal como estaba antes de 2e96493</summary>

> # 3. Tecnologías
>
> Tecnologías implementadas actualmente:
>
> * Node.js
> * npm
> * Electron
> * HTML
> * CSS
> * JavaScript
> * Git y GitHub
>
> Tecnologías planificadas:
>
> * TypeScript.
> * React para la interfaz de escritorio y la web móvil.
> * API/backend todavía por definir en detalle.
> * PostgreSQL como base de datos central.
> * Almacenamiento central para fotos.
> * Posiblemente Prisma para acceder a PostgreSQL; esta elección todavía no está cerrada.
>
> La versión actual con HTML, CSS y JavaScript es un prototipo de aprendizaje. La migración a React/TypeScript se hará de forma progresiva y explicada.

</details>

<details>
<summary>Archivo histórico: sección 4, tal como estaba antes de 2e96493</summary>

> # 4. Estado actual del proyecto
>
> La carpeta está en:
>
> ```text
> C:\Users\ezema\Desktop\stockizi
> ```
>
> Actualmente contiene:
>
> ```text
> stockizi/
> ├── .gitignore
> ├── apuntes/
> ├── tests/
> ├── node_modules/
> ├── DESARROLLO.md
> ├── index.html
> ├── main.js
> ├── navigation.js
> ├── package-lock.json
> ├── package.json
> ├── readme.md
> ├── renderer.js
> ├── styles.css
> └── stockizi.md
> ```
>
> Node instalado:
>
> ```text
> Node.js v26.7.0
> npm 11.19.0
> ```
>
> Electron ya fue instalado.
>
> Estado comprobado:
>
> * `npm start` abre la aplicación de escritorio.
> * Electron carga `index.html` desde `main.js`.
> * `styles.css` contiene la presentación visual.
> * `catalog.js` maneja consulta y edición limitada. `preload.js` expone consulta y guardado de productos; `main.js` llama a la API mediante `api-client.js`, sin entregar credenciales a la pantalla.
> * Productos permite buscar por nombre, editar precios y crear productos con stock inicial; el usuario confirmó el alta y su presencia en la API. También confirmó rubros/subcategorías editables, clasificación y filtros. Los múltiples códigos y su búsqueda exacta están implementados y probados, pendientes de aplicar `006_product_codes.sql` en su base. Cambios posteriores de stock/unidad siguen bloqueados.
> * En escritorio, el catálogo se desplaza arriba y la ficha permanece visible abajo. `renderer.js` conserva el prototipo anterior de edición local, pero ya no se carga desde `index.html`.
> * `navigation.js` conecta Inicio, Nueva venta, Productos y Caja en una barra lateral. Inicio muestra el estado del prototipo; Ventas y Caja todavía son secciones informativas pendientes de implementación.
> * La rama actual es `feature/productos-iniciales`.
> * Existe un formulario provisional de productos con nombre, costo, markup, precio de venta, stock y unidad.
> * Los productos consultados se muestran con moneda argentina y cantidades de hasta tres decimales. No se mezclan con datos de ejemplo locales.
> * Existe PostgreSQL local (`stockizi_dev`) y una API de consulta, edición limitada y alta. La edición real fue confirmada por el usuario; el alta se probó en PostgreSQL aislado y espera la migración 004 en su base.
> * `npm test` ejecuta pruebas automáticas del cálculo, validación y guardado provisional mediante Node.js, sin abrir Electron.
> * React, TypeScript y la interfaz móvil aún no están implementados. La API actual es local, no está lista para acceso desde otros equipos.
>
> `node_modules/` está instalado localmente y excluido de Git. Los nuevos archivos dentro de `apuntes/` también están ignorados; los apuntes que ya habían sido confirmados antes continúan registrados en el historial.

</details>

<details>
<summary>Archivo histórico: sección 37, tal como estaba antes de 2e96493</summary>

> # 37. Punto exacto donde quedamos
>
> Ya tenemos el proyecto inicial funcionando con Electron y el código se guarda en un repositorio Git/GitHub.
>
> La carpeta real es:
>
> ```text
> C:\Users\ezema\Desktop\stockizi
> ```
>
> Archivos existentes:
>
> ```text
> .gitignore
> DESARROLLO.md
> apuntes/              ignorado para nuevos archivos locales
> tests/renderer.test.cjs
> index.html
> main.js
> navigation.js
> package-lock.json
> package.json
> readme.md
> renderer.js
> styles.css
> stockizi.md
> node_modules/         instalado localmente e ignorado por Git
> ```
>
> Electron ya está instalado.
>
> Estado funcional actual:
>
> * Rubros conectados: migración 005, GET/POST de categories, POST de subcategories y PATCH de sus nombres. Administrar rubros permite nombres propios y editables. El producto guarda categoryId/subcategoryId opcionales con comprobación de concurrencia; precios/stock se conservan al cambiar solo la clasificación. La API sigue aceptando las peticiones anteriores sin clasificación.
> * El usuario confirmó que rubros/subcategorías funcionan en su base habitual; no repetir 005. La siguiente migración es 006 para códigos.
> * Verificación más reciente: 62 pruebas automáticas aprobadas y recorrido completo en Electron/PostgreSQL temporal. Además de alta, precios y rubros, se probaron múltiples códigos, ceros iniciales, unicidad con ocho solicitudes concurrentes, rechazo de código ajeno, retiro confirmado, conservación de stock, permisos, borrador protegido y búsqueda fuera de la primera página. Se revisó la ventana. 006 sigue pendiente en stockizi_dev del usuario; no se modificaron sus productos ni credenciales.
> * `codes-ui.js` maneja el diálogo y la búsqueda; `server/codes.js` consulta PostgreSQL con parámetros. El puente permite solo listar/agregar/quitar/buscar códigos mediante rutas locales fijas. En ventanas bajas se permite desplazamiento de la página para mantener una altura útil de lista, sin comprimirla a una sola línea.
>
> * `catalog.js` consulta y guarda mediante el puente aislado de Electron. El proceso principal solo permite esas operaciones desde el archivo local y el marco principal de la ventana.
> * La lista inicia vacía, muestra carga/error/éxito y no vuelve a productos de ejemplo si falla la API. Actualizar consulta nuevamente; si falla conserva los datos anteriores con advertencia explícita.
> * Búsqueda por nombre entre los registros cargados, IDs visibles para distinguir nombres repetidos, selección de ficha y Cargar más para las páginas siguientes. Actualizar reinicia la paginación y conserva la selección si el producto sigue cargado.
> * Edición de nombre, costo y venta conectada a `PATCH /api/products/:id`, con permisos y guardado real confirmados por el usuario. El porcentaje se calcula al editar y al guardar; abrir una ficha no corrige datos automáticamente. Guardar exige cambios válidos y respuesta exitosa de la API antes de cambiar el catálogo. Cancelar restaura el borrador; cambiar de producto o actualizar con cambios pendientes se bloquea hasta guardar o cancelar. Un error conserva el formulario. La comparación de nombre/costo/venta originales en el UPDATE evita sobrescribir cambios simultáneos en esos campos (409). No es una auditoría ni un historial de versiones.
> * Nuevo producto habilita stock inicial y unidad solamente durante el alta. Guarda producto y movimiento INITIAL (incluso cero) juntos mediante un trigger, sin pedir proveedor ni computadora. Registra fecha, producto, cantidad, unidad y saldo resultante. La aprobación del usuario fue registrada el 15/09/2026. No se inventa historial de productos anteriores. Compras, ventas, ajustes, identidad del empleado y pantalla de movimientos siguen pendientes.
> * Actualización posterior: el usuario confirmó que Nuevo producto funcionó y el artículo aparece en GET /api/products de su base. Ya no necesita repetir 004. La comprobación manual del movimiento por SQL aún no fue confirmada. El porcentaje editable está implementado según sección 9: pasaron 49 pruebas y la integración Electron/API/PostgreSQL temporal, con alta por porcentaje, cambio de costo que conserva venta, edición por porcentaje y reconsulta. No se modificaron datos habituales ni credenciales.
> * La migración `004_initial_stock.sql` ya fue aplicada por el usuario, quien confirmó el alta. Concede INSERT limitado; no concede UPDATE de stock/unidad ni escritura directa del historial. `stockizi_reader` permanece de solo lectura. La API valida stock inicial no negativo (hasta doce enteros/tres decimales), UNIT entero y otras unidades fraccionarias; no se redondea lo inválido.
> * El alta usa POST con una clave única por borrador. Repetir esa clave con los mismos datos recupera el producto sin duplicarlo; con otros datos responde 409. La clave no sobrevive a cancelar/cerrar/recargar: ante un alta incierta se debe reintentar el mismo borrador o consultar antes de crear otro. La navegación conserva el borrador. Nuevo y Actualizar no descartan cambios pendientes.
> * Pruebas del alta: 46 pruebas automáticas aprobadas, más PostgreSQL real temporal con las migraciones 001–004, permisos restringidos, rollback forzado del movimiento, cantidades cero/decimales y ocho solicitudes concurrentes sin duplicados. La edición existente sigue funcionando. No se ejecutó 004 ni se modificaron productos en la base habitual del usuario.
> * También pasó la prueba completa Electron → IPC → API → PostgreSQL temporal: alta de 1,2 kg, movimiento inicial y reconsulta. Captura revisada, sin errores de JavaScript. Se corrigió un error previo del catálogo: ORDER BY ahora usa el ID numérico de la tabla, no el alias convertido a texto que ordenaba 1, 11, 2. La prueba incluye IDs de uno y dos dígitos.
> * Verificación de esta edición: 39 pruebas automáticas aprobadas y prueba completa Electron → IPC → API con base simulada: bloqueo bajo costo, porcentaje 55,74 % para costo 1220 y venta 1900, guardado y reconsulta, stock protegido. Captura revisada. El 15/09/2026 el usuario confirmó `COMMIT` de `003`, configuró su conexión y comprobó que el precio guardado se conserva al usar Actualizar. La confirmación del guardado real proviene del usuario; el asistente no modificó sus productos. Durante el diagnóstico se comprobó configuración y permisos sin mostrar contraseñas.
> * El 14/09/2026 pasaron 30 pruebas automáticas (incluidas las del prototipo anterior). Una prueba de integración abrió Electron con la API existente, mostró 4 productos reales de desarrollo, verificó búsqueda, selección, Actualizar, controles de solo lectura y puente limitado sin acceso a Node. Se revisó la captura de esa ventana. No se modificaron productos ni se leyó `.env`.
>
> Prototipo anterior de edición local (conservado en `renderer.js`, NO activo en `index.html`):
>
> * La ventana de escritorio abre correctamente con `npm start`.
> * El CSS está separado de `index.html` en `styles.css`.
> * `renderer.js` controla la interacción de la interfaz.
> * El catálogo permite filtrar por nombre y rubro, muestra la cantidad de resultados y permite limpiar filtros. Agregar un producto limpia los filtros para que se vea la nueva carga. La búsqueda visual con fotos y los múltiples códigos todavía están pendientes.
> * La navegación lateral cambia la sección visible sin recrear el formulario ni perder productos durante la sesión. `navigation.js` se encarga de ese comportamiento.
> * Existe un formulario provisional para agregar y editar productos con nombre, costo, markup, precio de venta, stock y unidad de medida.
> * Seleccionar un producto carga sus datos en el formulario inferior y destaca la fila. Los identificadores estables evitan confundir productos cuando se filtra la lista.
> * Los campos son un borrador: el catálogo solo cambia al guardar. Guardar se habilita con cambios válidos y actualiza el mismo producto sin duplicarlo; cargar el formulario no recalcula su precio manual.
> * Cancelar restaura los datos guardados del producto seleccionado (o limpia una carga nueva). Nuevo producto inicia un formulario vacío. Si hay cambios pendientes, cambiar de producto, cancelar o iniciar otro pide confirmar el descarte; Seguir editando o Escape conserva el borrador.
> * La navegación entre secciones conserva también el borrador. Todavía no hay protección frente al cierre/recarga ni persistencia: este flujo solo debe usarse con datos de prueba.
> * Los productos se guardan temporalmente en un array y se muestran en una lista.
> * El precio sugerido se calcula desde costo y markup; el precio de venta sigue siendo editable y se guarda su valor actual.
> * Cambiar costo o markup vuelve a calcular el precio, por lo que todavía puede sobrescribir una edición manual previa.
> * Editar la venta actualiza el porcentaje sobre costo con dos decimales, conservando el precio escrito. Cambiar posteriormente el costo o el porcentaje vuelve a aplicar el cálculo hacia adelante.
> * El campo de stock cambia entre `step="1"` para unidades y `step="0.001"` para peso, longitud o volumen.
> * La validación JavaScript rechaza unidades fraccionarias, números inválidos, valores iniciales negativos y unidades desconocidas.
> * Los errores de la validación JavaScript se muestran dentro del formulario y no se guardan productos inválidos.
> * `npm test` pasa 15 pruebas de cálculo, validación, selección, edición sin duplicados, descarte/cancelación, filtros e identificadores y conservación de precios. El 14/09/2026 también se verificó el flujo en Chrome automatizado, sin errores JavaScript, y se revisaron capturas en 1100 × 750 y 390 × 844. Esto no sustituye una prueba manual en Electron.
> * Los precios se muestran con formato de pesos argentinos.
> * Las unidades usan códigos internos (`UNIT`, `KILOGRAM`, `METER`, `LITER`) y etiquetas visibles (`un.`, `kg`, `m`, `l`).
> * Los productos temporales se pierden al cerrar la aplicación porque todavía no existe persistencia.
> * Ya se practicó un flujo completo de rama, commit, push, Pull Request, merge y pull.
>
> Trabajo en curso:
>
> * PostgreSQL fue instalado y el usuario confirmó la conexión desde pgAdmin. La consulta `current_database()` confirmó que la base de desarrollo se llama `stockizi_dev`; se corrigió el nombre anterior `stockizi` en el SQL de permisos y la configuración de ejemplo.
> * `database/001_create_products.sql` prepara la primera tabla real de productos. Incluye identidad, nombre, costo, venta, porcentaje opcional, unidad, stock, estado activo y fecha de creación. Todavía faltan relaciones, auditoría y conexión a la API; no sustituye el modelo completo de la sección 8.
> * El stock SQL usa `NUMERIC` con validación de hasta tres decimales e integridad para `UNIT`, en lugar de redondear automáticamente cantidades antes de validarlas. Se permiten negativos. Los importes usan `NUMERIC(12, 2)` y el porcentaje todavía no se sincroniza automáticamente con el precio.
> * El usuario confirmó en pgAdmin `public.products` en su base `stockizi_dev` y ejecutó consultas, INSERT y UPDATE de prueba. No repetir `001`, `002` ni `003`: ya fueron aplicadas. El usuario confirmó también la edición y reconsulta desde Electron con el rol editor.
> * Primera API local preparada en `server/`: HTTP nativo de Node y `pg`, con `GET /api/products`, paginación de 100 registros, SQL parametrizado y decimales/IDs conservados como texto en JSON. Es un paso didáctico inicial, no la elección definitiva del framework/ORM.
> * `npm run api` carga `.env` (privado e ignorado por Git), comprueba la tabla y escucha únicamente en `127.0.0.1`. El usuario confirmó `002`, configuró sus credenciales y obtuvo los productos; también se comprobó la consulta desde Electron. No hay autenticación de usuarios ni acceso desde otros equipos. Guía: `server/README.md`.
>
> ```text
> Rama: feature/productos-iniciales
> ```
>
> Próximo paso recomendado:
>
> * Mejora visual solicitada: hacer la interfaz más cuidada tomando como referencia las capturas y videos de StockFácil ya revisados, conservando catálogo arriba y formulario accesible. Queda planificada; no se rediseñó en este cambio de precios.
> * Regla actual de precios comprobada con 49 pruebas y Electron/PostgreSQL temporal: costo conserva porcentaje y actualiza venta. Esta decisión reemplaza la regla anterior que conservaba la venta al cambiar el costo.
>
> * Revisar el recorrido `catalog.js` → `preload.js` → `main.js` → API → PostgreSQL con el usuario.
> * Aplicar 004 con el usuario en Query Tool de stockizi_dev, reiniciar API/Electron y comprobar Nuevo producto junto con su movimiento Stock inicial. No repetir 001–003 ni cambiar credenciales. Enseñar INSERT y el trigger automático; revisar el historial con la consulta de database/README.md.
> * Activar 006 con el usuario y probar dos códigos sobre un mismo producto, búsqueda por ambos y rechazo de duplicados en otro producto. No repetir 001–005. Después evaluar la base del selector de productos para Nueva venta. El rediseño visual sigue planificado como etapa posterior.
> * Definir una acción clara para recalcular el precio sin sobrescribir accidentalmente una edición manual.
> * Revisar visualmente la navegación inicial y continuar con las funciones de Productos previstas en el alcance.
> * Preparar la migración didáctica a React y TypeScript sin perder lo aprendido.
>
> React y TypeScript todavía no están implementados. La lectura y edición local están comprobadas. El alta con movimiento inicial está implementada y probada en PostgreSQL aislado, pendiente de activar con 004 en la base del usuario. Autenticación y despliegue compartido siguen pendientes.
>
> NO volver a instalar Electron si ya está instalado.
>
> NO crear otro proyecto desde cero sin evaluar primero el estado y la arquitectura existentes.

</details>

<details>
<summary>Archivo histórico: sección 40, tal como estaba antes de 2e96493</summary>

> # 40. Decisiones pendientes
>
> Estas decisiones afectan la arquitectura o los datos y deben evaluarse antes de implementar las áreas correspondientes.
>
> ## 40.1. Producto y stock
>
> * Definir si un producto puede tener un solo distribuidor o varios distribuidores con costos y códigos diferentes.
> * Definir el orden exacto entre cálculo, redondeo configurable y corrección manual del precio de venta.
> * Definir si el margen se guarda o se calcula para cada consulta y reporte.
> * Diseñar un historial de movimientos de stock para poder auditar entradas, ventas, ajustes y pérdidas.
> * Definir si habrá un único depósito/local o stock separado por ubicación en el futuro.
>
> ## 40.2. Backend y datos
>
> * Elegir el framework del backend/API.
> * Confirmar si se utilizará Prisma para trabajar con PostgreSQL.
> * Elegir dónde se alojarán la API, PostgreSQL y las fotos.
> * Definir copias de seguridad, restauración y conservación del historial.
> * Definir el comportamiento cuando una PC pierda temporalmente la conexión.
>
> ## 40.3. Operaciones comerciales
>
> * Definir si Stockizi reemplazará o complementará StockFácil y cómo será la transición.
> * Confirmar el alcance operativo indispensable y los escenarios de aceptación antes de poner Stockizi en uso.
> * Contrastar el Excel de ejemplo ya inspeccionado (sección 5.4) con la exportación completa del negocio y acordar correspondencias, unidades, duplicados y normalización de cantidades.
> * Definir el alcance de importación de productos; el ejemplo incluye stock y precios, pero la exportación de deudas e historial sigue sin confirmar.
> * Precisar cómo se relacionan los pagos con ventas, compras y cobros de cuenta corriente.
> * Definir las reglas exactas para pagos parciales y deudas futuras con proveedores.
> * Definir cómo se corrige una venta sin perder la auditoría de la operación original.
> * Diseñar la integración o exportación necesaria para Posnet/ARCA.
>
> ## 40.4. Acceso y comunicación
>
> * Definir autenticación, permisos y recuperación de acceso.
> * Definir permisos para vender con stock insuficiente y modificar manualmente precios durante una venta.
> * Elegir la tecnología de notificaciones para recordatorios móviles.
> * Definir límites, formatos, compresión y privacidad de las fotos.
>
> Estas cuestiones figuran como `POR DECIDIR`; no deben asumirse como implementadas ni resolverse de manera accidental durante una pantalla provisional.

</details>

### Redacciones reemplazadas en esta reorganización

Se conservan literalmente los fragmentos sustituidos; su motivo y estado nuevo se indican antes de cada cita. No constituyen reglas adicionales.

#### Antecedente de sección 1

Aclaración documental del 16/09/2026.

> El desarrollo será progresivo y explicado. La dinámica de trabajo y aprendizaje se describe en [DESARROLLO.md](DESARROLLO.md).

#### Antecedente de sección 5

Aclaración documental del 16/09/2026.

> FASE 3 — Datos centrales (PLANIFICADA)

#### Antecedente de sección 5

Decisión del 16/09/2026: deudas dentro de Clientes. La ubicación de accesos adicionales sigue pendiente.

> * `Clientes`: información necesaria de clientes.
> * `Cuenta corriente`: deudas y cobros posteriores.

#### Antecedente de sección 7

El 16/09/2026 se acordó desactivar/reactivar, con aviso si hay existencias.

> * Eliminar/desactivar productos.

#### Antecedente de sección 8

Aclaración documental del 16/09/2026.

> Los campos definidos para `Product` son:

#### Antecedente de sección 8

El 16/09/2026 se acordaron cero, uno o varios proveedores por producto.

> supplierId
> categoryId

#### Antecedente de sección 8

El 16/09/2026 se resolvió la cardinalidad funcional; detalles técnicos pendientes.

> * `supplierId`: distribuidor asociado en el modelo inicial; la relación definitiva está por decidir.

#### Antecedente de sección 8

Ejemplo inicial reemplazado técnicamente por NUMERIC con restricciones en 001; ya implementado antes del 16/09/2026, sin fecha exacta adicional.

> En PostgreSQL se utilizará un tipo decimal exacto, por ejemplo:
>
> ```text
> NUMERIC(12, 3)
> ```

#### Antecedente de sección 9

Regla de igualdad reemplazada funcionalmente el 16/09/2026; aún vigente en código y SQL.

> Decisión confirmada: al guardar la ficha de un producto, el precio de venta no puede ser menor que el costo. La igualdad está permitida. La pantalla y la API bloquean importes inválidos; la migración `003` agrega la misma restricción en PostgreSQL, sin corregir datos existentes automáticamente. Esta decisión corresponde al catálogo; las reglas de descuentos y precios excepcionales en una venta se revisarán al implementar Ventas.

#### Antecedente de sección 16

El 16/09/2026 pagos parciales y deudas se acordaron para Compras, no solo como posibilidad futura.

> Los proveedores actualmente se pagan **en el momento**.
>
> Sin embargo, queremos diseñar el sistema de forma suficientemente flexible para poder soportar pagos parciales o deuda en el futuro.

#### Antecedente de sección 16

El 16/09/2026 se permitió compra sin proveedor, incluso con deuda pendiente.

> supplierId
> total

#### Antecedente de sección 17

El 16/09/2026 se separaron compra, pago, deuda y gasto.

> 4. Registra el pago.
> 5. Registra la salida de dinero.

#### Antecedente de sección 20

El 16/09/2026 se confirmó cuenta corriente con cobros parciales.

> 4. Se registra el/los pagos.

#### Antecedente de sección 29

El 16/09/2026 se separó compra de mercadería de otros gastos; un proveedor puede cobrar por distintos conceptos.

> * Proveedores.

#### Antecedente de sección 31

El 16/09/2026 se confirmó que una venta fiada no implica cobro.

> ventas ↑
> ingresos ↑
> productos vendidos ↑

#### Antecedente de sección 38

Clasificación ampliada por pedido del usuario el 16/09/2026.

> IMPLEMENTADO   → existe y fue comprobado en el programa
> EN CURSO       → se está desarrollando actualmente
> PLANIFICADO    → fue acordado, pero todavía no está implementado
> POR DECIDIR    → necesita una decisión antes de desarrollarse

#### Antecedente de sección 36

16/09/2026: aclarado que la guía de aprendizaje es local y no forma parte del clon del repositorio. Se conserva su referencia original:

> Se calibrará lo que ya conoce para evitar repetir fundamentos innecesariamente. Los ejercicios y cambios pequeños se utilizarán cuando ayuden, sin convertir cada paso en una clase larga. La dinámica concreta se mantiene en [DESARROLLO.md](DESARROLLO.md).

### Cierre de la revisión documental — 16/09/2026

Se contrastaron los estados con package.json, index.html, módulos activos, rutas API y migraciones 001–006. Se volvió a ejecutar npm test (62 aprobadas). No se modificó código, SQL ni la base habitual. Las guías de database/ y server/ no se reescribieron en esta tarea: conservan hitos históricos y la indicación antigua de 006 pendiente; para el estado comunicado por el usuario prevalece A. El backup de base y la prueba manual de códigos siguen pendientes, no se confunden con el commit de Git.



### Precio estricto implementado en pantalla/API — 16/09/2026

64 pruebas aprobadas y PostgreSQL/Electron temporal con 007. Se comprobó fallo de migración por igualdad sin cambiar datos, corrección explícita por API y rechazo SQL de igualdad después. Migración habitual pendiente; no se leyeron credenciales ni se modificaron productos reales. Las pruebas previas de 62 casos corresponden a la reorganización, no se borran.

Las siguientes redacciones de la revisión anterior quedan superadas por el estado actual de A/B/D:

> | Precio del catálogo | Permite venta igual al costo; rechaza menor | Exigir venta mayor que costo; error si no cumple, sin corrección automática |

> La regla nueva de precio estricto requerirá otro archivo numerado y validación de datos existentes.

> - `npm test`: 62 pruebas aprobadas en la revisión del 16/09/2026, sobre precios, API, cliente, catálogo, rubros, códigos y prototipo anterior. No significa que las funciones acordadas futuras estén probadas.

> 2. Antes de implementar la venta estrictamente mayor al costo, revisar productos con igualdad y acordar cómo regularizarlos. No cambiar precios existentes silenciosamente.

> Hoy se permite venta igual al costo.

> - **Acordado, falta implementar:** Venta estrictamente mayor que costo en catálogo; bloquear cualquier resultado inválido sin aumentarlo automáticamente.

> Regla funcional acordada el 16/09/2026, pendiente de implementar: en el catálogo la venta debe ser estrictamente mayor que el costo. Si el precio calculado, redondeado o manual queda igual o por debajo, mostrar un error y bloquear el guardado; no subirlo automáticamente. El código actual todavía acepta la igualdad: `pricing.js` rechaza solo `sale < cost`, y 003 usa `sale_price >= cost_price`. Se necesitará una nueva migración y revisar los productos existentes sin corregirlos silenciosamente. Las excepciones de precios/descuentos durante una venta se decidirán más adelante; no hay autorización de administrador aprobada todavía.

> Faltan la implementación y el tratamiento explícito de registros que hoy tienen igualdad.

> - La igualdad venta/costo sigue admitida tanto por pricing.js como por CHECK de 003. No cambiar 003: una nueva migración deberá aplicar el nuevo acuerdo cuando se implemente.
