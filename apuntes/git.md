# Machete de Git

Git guarda el historial de cambios del proyecto. GitHub es un servicio donde se pueden alojar repositorios Git; no son lo mismo.

## Configuración inicial

Se realiza una vez en la computadora:

```powershell
git config --global user.name "Tu nombre"
git config --global user.email "tu@email.com"
```

## Crear el repositorio

Dentro de la carpeta del proyecto:

```powershell
git init
```

## Flujo habitual

```powershell
git status
git add nombre-del-archivo
git commit -m "Describe el cambio"
```

Para preparar todos los cambios visibles:

```powershell
git add .
```

Antes de usarlo, revisar siempre `git status` para no agregar algo accidentalmente.

## Ver cambios

```powershell
git diff
git diff --staged
```

- `git diff`: cambios todavía no preparados.
- `git diff --staged`: cambios preparados para el próximo commit.

## Historial

```powershell
git log
git log --oneline
```

## Estados de un archivo

```text
Sin seguimiento → Git todavía no lo registra
Modificado       → cambió desde el último commit
Preparado        → está incluido en el próximo commit
Confirmado       → quedó guardado en el historial
```

Flujo:

```text
editar → git add → git commit
```

## Ramas

```powershell
git branch
git switch -c nombre-de-rama
git switch main
```

Una rama permite trabajar en cambios sin alterar directamente la línea principal.

## Restaurar con cuidado

Quitar un archivo del área preparada sin borrar su contenido:

```powershell
git restore --staged nombre-del-archivo
```

Descartar cambios locales de un archivo:

```powershell
git restore nombre-del-archivo
```

El segundo comando elimina cambios no confirmados. Revisar `git diff` antes de usarlo.

## Archivo .gitignore

Indica qué archivos o carpetas no debe registrar Git. Para Stockizi necesitaremos al menos:

```gitignore
node_modules/
```

`node_modules` se reconstruye con `npm install`, por lo que no debe guardarse en el repositorio.

## Commits recomendados

Un commit debería representar un cambio concreto y entendible:

```powershell
git commit -m "Separa los estilos en un archivo CSS"
git commit -m "Configura la ventana inicial de Electron"
```

Evitar mensajes poco informativos como `cambios`, `cosas` o `final`.

