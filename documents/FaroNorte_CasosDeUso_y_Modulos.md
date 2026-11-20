# Faro Norte – Casos de uso y módulos de desarrollo

Versión 0.1 · 03/11/2026

Este archivo tiene dos partes:

1. **Casos de uso**: qué hace cada persona en el sistema.
2. **Módulos de desarrollo paso a paso**: pasos chicos, cada uno con su prompt listo para pasarle a Antigravity sin saturarlo.

---

## Cómo trabajar con Antigravity sin saturarlo

- **Un paso por conversación o tarea.** No le pidas un módulo entero: pedile un paso, probalo y recién ahí pasá al siguiente.
- **Commit al terminar cada paso** (`git commit`), así podés volver atrás si algo se rompe.
- **Guardá las reglas fijas en un archivo del proyecto** (`AGENTS.md` o el archivo de reglas que use Antigravity) para no repetirlas en cada prompt. Ver el bloque de abajo.
- **Decile siempre qué NO tocar.** Cada prompt de este documento termina con esa línea.
- **Pegá solo el paso actual**, no todo este documento. Si necesita contexto, que lea el `AGENTS.md`.
- **Si algo falla**, pedile que arregle solo ese error antes de seguir.
- Cada paso tiene un **«Listo cuando»**: es tu checklist para probarlo a mano.

### Bloque para `AGENTS.md` (reglas permanentes)

```md
# Faro Norte – Reglas del proyecto

- Sistema web de gestión de UN solo club (Faro Norte). Sin multi-club.
- Idioma de la interfaz: español rioplatense, trato de "vos". Moneda en pesos con punto de miles ($ 18.000). Fechas dd/mm/aaaa.
- Stack: Node.js 22 + TypeScript, Fastify, Drizzle ORM (SQLite en desarrollo, PostgreSQL en producción), React + Vite + Tailwind como PWA mobile-first, Zod para validar, ExcelJS, PDFKit, Recharts.
- Monorepo: apps/api, apps/web, packages/shared (tipos y esquemas Zod compartidos).
- Los importes se guardan como enteros (pesos, sin decimales) y nunca como float.
- Nada de dinero se borra: se anula con registro (anulado = true) y se excluye de los totales.
- Las transferencias entre cuentas no cuentan como ingreso ni gasto.
- Generar cuotas es idempotente: nunca duplica (único por socio + período).
- La página pública NUNCA expone nombres, DNI, teléfonos, fotos ni comprobantes.
- Diseño mobile-first (360 px), botones grandes, barra inferior: Inicio, Socios, Cuotas, Cobros, Más.
- Trabajá solo en el paso que te pido. No refactorices ni toques módulos que no mencioné.
- Al terminar, resumí en 5 líneas qué hiciste y cómo probarlo.
```

---

# PARTE 1 – Casos de uso

## Actores

| Actor | Descripción |
|---|---|
| Administrador | Presidente o responsable del sistema. Acceso total. |
| Tesorero | Cuotas, cobros, tesorería, reportes y transparencia. |
| Secretario | Socios, familias, importación y aptos médicos. |
| Profe | Consulta de socios y aptos médicos. |
| Familia | Quien paga por uno o más socios (portal, fase posterior). |
| Visitante | Cualquier persona con el link de transparencia. |

## 1. Acceso y cuenta

| ID | Actor | Caso de uso | Flujo principal | Reglas y alternativas |
|---|---|---|---|---|
| CU-01 | Comisión y personal | Iniciar sesión | Ingresa email y contraseña y toca **Entrar**; el sistema lo lleva a Inicio. | Si los datos son incorrectos, muestra error sin decir cuál campo falla. Límite de intentos. |
| CU-02 | Comisión y personal | Cerrar sesión | Toca el ícono de salir y vuelve al login. | La sesión también vence por inactividad. |
| CU-03 | Comisión y personal | Cambiar mi contraseña | Toca el candado, ingresa la actual y la nueva. | La nueva cumple un mínimo de seguridad. |
| CU-04 | Administrador | Generar contraseña nueva a otro usuario | Entra al usuario y toca **Generar contraseña**; el sistema muestra una temporal. | El usuario debe cambiarla al ingresar. No hay recuperación por email. |
| CU-05 | Comisión y personal | Instalar la app en el celular | Sigue las instrucciones de la tarjeta de Inicio o el banner del navegador. | Android: Instalar app. iPhone: Compartir, Agregar a inicio. |

## 2. Inicio

| ID | Actor | Caso de uso | Flujo principal | Reglas y alternativas |
|---|---|---|---|---|
| CU-06 | Comisión | Ver el panel de Inicio | Ve saludo, fecha y tarjetas: socios activos, cobrado del mes, deuda vencida, plata en cuentas y aptos vencidos. | Montos negativos y deuda en rojo. Singular y plural correctos. |
| CU-07 | Comisión | Generar cuotas desde el aviso | Toca **Generarlas ahora** y va a Cuotas. | El aviso solo aparece si faltan cuotas del mes. |
| CU-08 | Administrador | Completar «Primeros pasos» | Sigue el checklist de 4 puntos; cada uno se tilda solo al cumplirse. | Se oculta o se minimiza al completar los 4. |

## 3. Socios y familias

| ID | Actor | Caso de uso | Flujo principal | Reglas y alternativas |
|---|---|---|---|---|
| CU-09 | Secretario | Dar de alta un socio | Toca **+ Nuevo socio**, completa datos, categoría y familia, guarda. | DNI único. Si es menor, pide tutor. N° de socio automático. |
| CU-10 | Secretario | Editar un socio | Abre la ficha, cambia datos y guarda. | Queda registro en auditoría. |
| CU-11 | Secretario | Dar de baja o marcar vitalicio | Cambia el estado desde la ficha. | Las bajas no generan cuotas nuevas pero conservan el historial. |
| CU-12 | Comisión y profes | Buscar y filtrar socios | Escribe nombre, DNI, N° o familia; filtra por categoría, estado y apto; toca **Buscar**. | Cada fila muestra N°, estado, edad y etiqueta de apto. |
| CU-13 | Secretario | Gestionar familias | Ve el listado, busca por quien paga, abre una familia, mueve socios entre familias. | Una familia tiene un solo responsable de pago. |
| CU-14 | Secretario | Registrar apto médico | Carga la fecha de vencimiento en la ficha del socio. | Estados: vigente, vencido, sin apto. |
| CU-15 | Secretario | Descargar planilla modelo | Elige **Planilla Excel** o **Versión CSV**. | Incluye instrucciones y una hoja de ejemplos de todos los casos. |
| CU-16 | Secretario | Importar padrón con vista previa | Elige el archivo, toca **Revisar planilla**, mira cómo quedó cada fila y confirma. | Nada se guarda antes de confirmar. Si el DNI existe, actualiza. Las filas con error se marcan y no frenan al resto. |
| CU-17 | Secretario | Exportar el padrón | Toca **Descargar padrón** y obtiene el Excel con el mismo formato de la planilla modelo. | Se puede corregir y reimportar. |

## 4. Cuotas

| ID | Actor | Caso de uso | Flujo principal | Reglas y alternativas |
|---|---|---|---|---|
| CU-18 | Tesorero | Generar las cuotas del mes | Elige el mes, ve cuántos socios activos no tienen cuota y toca **Generar n cuotas**. | Idempotente: nunca duplica. Vencen el día 10 (configurable). Se puede repetir si se suman socios. |
| CU-19 | Tesorero | Ver el estado de cuotas del mes | Ve emitido, cobrado, falta cobrar y cobrabilidad con barra. | Cambia al elegir otro mes. |
| CU-20 | Tesorero | Ver familias que deben | Ve la lista con monto, cantidad de cuotas y fecha desde la que deben; puede buscar. | Incluye cuotas vencidas de cualquier mes. |
| CU-21 | Tesorero | Recordar deuda por WhatsApp | Toca **Recordar** y se abre WhatsApp con el mensaje armado. | Sin teléfono cargado, avisa que falta. |

## 5. Cobros

| ID | Actor | Caso de uso | Flujo principal | Reglas y alternativas |
|---|---|---|---|---|
| CU-22 | Tesorero | Cobrar a una familia | Busca por nombre del chico, de quien paga o DNI; elige cuotas, medio de pago y cuenta de destino; confirma. | Un solo recibo por familia. Descuento familiar aplicado. Salda primero las cuotas más viejas. |
| CU-23 | Tesorero | Ver recibos emitidos | Elige Desde y Hasta y toca **Ver**. | Si no hay, muestra «No hay cobros entre esas fechas». |
| CU-24 | Tesorero | Descargar o compartir un recibo | Abre el recibo y descarga el PDF. | Numeración correlativa. |
| CU-25 | Tesorero | Anular un recibo | Abre el recibo, anula y escribe el motivo. | Las cuotas vuelven a deuda y el ingreso se excluye de los totales. Queda en auditoría. |
| CU-26 | Tesorero | Confirmar aviso de pago del portal *(fase posterior)* | Abre **Avisos de pago del portal**, revisa y confirma o rechaza. | Confirmar genera el cobro. |

## 6. Tesorería

| ID | Actor | Caso de uso | Flujo principal | Reglas y alternativas |
|---|---|---|---|---|
| CU-27 | Tesorero | Ver tesorería | Ve saldo total y por cuenta, y Entró / Salió / Resultado del mes. | Las transferencias no suman ni restan. |
| CU-28 | Tesorero | Filtrar movimientos | Elige mes y tipo; abre **Más filtros** (cuenta, rubro, texto). | Estado vacío con botón **Cargar un gasto**. |
| CU-29 | Tesorero | Cargar un gasto | Elige Gasto, importe, fecha, rubro, cuenta, detalle y comprobante opcional; guarda. | Casilla «cargar otro» para cargar en serie. |
| CU-30 | Tesorero | Cargar un ingreso (no de cuotas) | Elige Ingreso, importe, fecha, «De dónde viene», cuenta de entrada y detalle. | Ej.: buffet, rifa, sponsor. |
| CU-31 | Tesorero | Transferir entre cuentas | Elige Transferencia, importe, cuenta origen y destino. | Origen y destino deben ser distintos. |
| CU-32 | Tesorero | Adjuntar comprobante | Saca foto o elige archivo (imagen o PDF). | Solo lo ve la comisión. |
| CU-33 | Tesorero | Anular un movimiento | Abre el movimiento y anula con motivo. | No se borra; se excluye de los totales. |
| CU-34 | Tesorero | Bajar planilla de tesorería | Toca **Bajar planilla (Excel)**. | Respeta los filtros activos. |

## 7. Reportes

| ID | Actor | Caso de uso | Flujo principal | Reglas y alternativas |
|---|---|---|---|---|
| CU-35 | Comisión | Ver Ingresos y gastos | Elige período y ve ingresos, gastos, superávit, detalle por rubro y gráfico Mes a mes. | Con **Ver los números** se ve la tabla del gráfico. No incluye anulados ni transferencias. |
| CU-36 | Comisión | Ver Cobranza | Ve emitido, cobrado y porcentaje por mes. | |
| CU-37 | Comisión | Ver Morosos | Ve familias con deuda, monto y antigüedad. | |
| CU-38 | Comisión | Ver Socios | Ve altas, bajas, categorías y aptos médicos. | |
| CU-39 | Comisión | Bajar reportes en Excel | Toca **Bajar planilla (Excel)**. | |

## 8. Transparencia

| ID | Actor | Caso de uso | Flujo principal | Reglas y alternativas |
|---|---|---|---|---|
| CU-40 | Tesorero | Publicar o despublicar la página | Tilda **Publicar la página** y guarda. | Si se apaga, el link informa que el club no publica sus cuentas por ahora. |
| CU-41 | Tesorero | Elegir qué se muestra | Define «Mostrar desde» y tilda qué más se muestra (porcentaje cobrado, cantidad de socios y familias, plata total, detalle de gastos). | Aviso de revisar que los detalles no tengan datos personales. |
| CU-42 | Tesorero | Escribir el mensaje de la comisión | Escribe el texto opcional y guarda. | |
| CU-43 | Tesorero | Marcar rubros privados | Va a **Elegir rubros privados** y marca. | Se suman en «Otros»; los totales siguen reales. |
| CU-44 | Tesorero | Compartir el link | Toca **Ver la página**, **Copiar link** o **Compartir por WhatsApp**. | |
| CU-45 | Visitante | Ver la página pública | Abre el link sin usuario ni contraseña. | Nunca se ven nombres, DNI, teléfonos, fotos ni comprobantes. |

## 9. Configuración

| ID | Actor | Caso de uso | Flujo principal | Reglas y alternativas |
|---|---|---|---|---|
| CU-46 | Administrador | Configurar datos del club y escudo | Edita nombre, contacto y sube el escudo. | El escudo se usa en login, encabezado y PWA. |
| CU-47 | Administrador | Definir categorías y valor de cuota | Crea o edita categorías con su valor. | Cambiar el valor no altera cuotas ya emitidas. |
| CU-48 | Administrador | Definir descuento familiar y vencimiento | Edita el descuento y el día de vencimiento. | |
| CU-49 | Administrador | Gestionar cuentas | Crea o edita cuentas (Caja efectivo, Banco, Mercado Pago, Cantina / Buffet) con saldo inicial. | Una cuenta con movimientos no se elimina, se desactiva. |
| CU-50 | Administrador | Gestionar rubros | Crea rubros de ingreso y gasto; marca privados. | Enlazado desde «¿Falta un rubro?». |
| CU-51 | Administrador | Gestionar usuarios y roles | Crea usuarios, asigna rol y los desactiva. | Roles: administrador, tesorero, secretario, profe. |

---

# PARTE 2 – Módulos de desarrollo paso a paso

Orden recomendado. Cada paso es chico a propósito. **No pases al siguiente hasta cumplir el «Listo cuando».**

Resumen:

| Módulo | Nombre | Pasos |
|---|---|---|
| M0 | Base del proyecto | 0.1 a 0.7 |
| M1 | Configuración mínima | 1.1 a 1.3 |
| M2 | Socios y familias | 2.1 a 2.7 |
| M3 | Cuotas | 3.1 a 3.3 |
| M4 | Cobros y recibos | 4.1 a 4.3 |
| M5 | Tesorería | 5.1 a 5.5 |
| M6 | Inicio (panel) | 6.1 a 6.2 |
| M7 | Reportes | 7.1 a 7.2 |
| M8 | Transparencia | 8.1 a 8.3 |
| M9 | Cierre y producción | 9.1 a 9.4 |
| M10 | Portal de familias (después) | 10.1 |

---

## M0 – Base del proyecto

### Paso 0.1 – Repositorio y estructura

- **Objetivo:** monorepo con TypeScript listo.
- **Tareas:** crear carpetas `apps/api`, `apps/web`, `packages/shared`; `package.json` con workspaces; TypeScript, ESLint y Prettier; scripts `dev`, `build`, `lint`; `.gitignore`; `AGENTS.md` con las reglas de arriba.
- **Listo cuando:** `npm install` y `npm run lint` corren sin errores.
- **Prompt:**

```
Creá un monorepo con npm workspaces: apps/api (Node 22 + TypeScript + Fastify), apps/web (React + Vite + TypeScript + Tailwind) y packages/shared (TypeScript). Agregá ESLint, Prettier, .gitignore y scripts dev/build/lint en la raíz. Creá el archivo AGENTS.md con las reglas que te pego a continuación: [pegar bloque]. Solo la estructura, sin lógica de negocio. No agregues nada más.
```

### Paso 0.2 – Base de datos y esquema inicial

- **Objetivo:** base creada con migraciones y las tablas de la Parte 8 del documento de visión.
- **Tareas:** Drizzle ORM con SQLite en desarrollo; tablas `usuarios`, `club`, `categorias`, `familias`, `socios`, `cuotas`, `recibos`, `recibo_items`, `cuentas`, `rubros`, `movimientos`, `avisos_de_pago`, `auditoria`; importes como enteros; índices únicos (DNI, socio + período).
- **Listo cuando:** `npm run db:migrate` crea el archivo de base y las tablas.
- **Prompt:**

```
En apps/api configurá Drizzle ORM con SQLite (better-sqlite3) y creá el esquema con estas tablas: usuarios, club (una sola fila), categorias, familias, socios, cuotas, recibos, recibo_items, cuentas, rubros, movimientos, avisos_de_pago, auditoria. Importes como enteros. Únicos: socios.dni y cuotas(socio_id, periodo). Agregá scripts db:generate y db:migrate y un seed que cree el club Faro Norte y un usuario administrador. Solo base de datos: no crees endpoints ni pantallas.
```

### Paso 0.3 – API base

- **Objetivo:** servidor con estructura limpia.
- **Tareas:** Fastify con `/api/health`, manejo de errores uniforme, validación con Zod, variables de entorno, CORS para el front en desarrollo.
- **Listo cuando:** `GET /api/health` devuelve `{ ok: true }`.
- **Prompt:**

```
En apps/api armá el servidor Fastify con: ruta GET /api/health, manejador de errores que devuelva siempre {error, mensaje}, carga de variables de entorno validada con Zod, y estructura de carpetas por módulo (routes, services, schemas). Sin autenticación todavía. No toques el esquema de la base ni apps/web.
```

### Paso 0.4 – Autenticación (backend)

- **Objetivo:** login seguro con roles.
- **Tareas:** contraseñas con argon2; sesión con cookie httpOnly; endpoints `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/cambiar-clave`; middleware por rol (admin, tesorero, secretario, profe); límite de intentos.
- **Listo cuando:** se puede iniciar sesión con el usuario del seed y `me` devuelve nombre y rol.
- **Prompt:**

```
En apps/api implementá autenticación: login por email y contraseña con argon2, sesión por cookie httpOnly, endpoints POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me y POST /api/auth/cambiar-clave. Agregá un middleware requireRole(...roles) y rate limit en el login. Roles: administrador, tesorero, secretario, profe. Agregá tests del login. No hagas pantallas ni toques otros módulos.
```

### Paso 0.5 – Frontend base y layout móvil

- **Objetivo:** el esqueleto visual de la app.
- **Tareas:** React Router; layout con encabezado (menú, escudo, nombre, candado, salir); barra inferior (Inicio, Socios, Cuotas, Cobros, Más); menú lateral (Inicio, Socios, Cuotas, Cobros, Tesorería, Reportes, Transparencia, Configuración); páginas vacías con título; componentes base (botón, tarjeta, input, select, tabs).
- **Listo cuando:** se navega por todas las secciones desde el celular o la vista móvil del navegador.
- **Prompt:**

```
En apps/web armá el layout mobile-first con React Router y Tailwind: encabezado con menú hamburguesa, escudo, nombre "Faro Norte", ícono de candado e ícono de salir; barra inferior fija con Inicio, Socios, Cuotas, Cobros y Más; menú lateral con Inicio, Socios, Cuotas, Cobros, Tesorería, Reportes, Transparencia y Configuración. Cada ruta muestra solo un título por ahora. Creá componentes base reutilizables: Button, Card, Input, Select, Tabs. Color principal azul. Sin llamadas a la API todavía.
```

### Paso 0.6 – Pantalla de login y rutas protegidas

- **Objetivo:** conectar el login con el backend.
- **Tareas:** pantalla de login (escudo, «Faro Norte», «Ingreso de la comisión y el personal», email, contraseña, **Entrar**, texto de contraseña olvidada); guardia de rutas; salir; cambiar contraseña desde el candado.
- **Listo cuando:** sin sesión te manda al login, con sesión entrás a Inicio y podés salir.
- **Prompt:**

```
En apps/web creá la pantalla de login con el escudo, el título "Faro Norte", el subtítulo "Ingreso de la comisión y el personal", campos Email y Contraseña, botón "Entrar" y el texto "¿Olvidaste la contraseña? Pedile al administrador del club que te genere una nueva." Conectala con /api/auth/login. Agregá guardia de rutas, botón de salir y un modal de cambiar contraseña desde el candado. Mostrá errores claros. No toques el backend.
```

### Paso 0.7 – PWA instalable

- **Objetivo:** que se pueda instalar en el celular.
- **Tareas:** manifest con nombre e íconos del club; service worker con caché de la interfaz; aviso si no hay conexión.
- **Listo cuando:** Chrome ofrece **Instalar app** y queda con el nombre «Faro Norte».
- **Prompt:**

```
Convertí apps/web en una PWA instalable (vite-plugin-pwa): manifest con nombre "Faro Norte", íconos y color del tema, service worker que cachee la interfaz, y un aviso visible cuando no hay conexión. No cambies pantallas ni la API.
```

---

## M1 – Configuración mínima

### Paso 1.1 – Datos del club, categorías y cuotas

- **Objetivo:** poder definir categorías y valores (necesario antes de cargar socios).
- **Tareas:** API y pantalla de Configuración: datos del club, subida de escudo, categorías con valor de cuota, descuento familiar, día de vencimiento.
- **Listo cuando:** se crean categorías con valor y se sube el escudo, que aparece en el encabezado.
- **Prompt:**

```
Implementá el módulo Configuración, parte 1. Backend: endpoints para leer y editar los datos del club (nombre, contacto, escudo, día de vencimiento, descuento familiar) y CRUD de categorías con valor de cuota (solo rol administrador). Frontend: pantalla Configuración con estas secciones. El escudo subido se muestra en login y encabezado. No implementes cuentas, rubros ni usuarios todavía.
```

### Paso 1.2 – Cuentas y rubros

- **Tareas:** CRUD de cuentas (con saldo inicial) y rubros (ingreso o gasto, con marca de privado). Cuentas semilla: Caja efectivo, Banco, Mercado Pago, Cantina / Buffet.
- **Listo cuando:** se crean, editan y desactivan; las que tienen movimientos no se eliminan.
- **Prompt:**

```
Agregá a Configuración la gestión de cuentas (nombre, saldo inicial, activa) y rubros (nombre, tipo ingreso/gasto, privado). Creá el seed con las cuentas Caja efectivo, Banco, Mercado Pago y Cantina / Buffet. Una cuenta o rubro con movimientos no se elimina, solo se desactiva. Backend y pantalla. No toques otras secciones.
```

### Paso 1.3 – Usuarios y roles

- **Tareas:** crear usuarios, asignar rol, desactivar, generar contraseña temporal (CU-04); permisos por rol aplicados en el menú y la API.
- **Listo cuando:** un tesorero no ve Configuración y un secretario no ve Tesorería.
- **Prompt:**

```
Agregá a Configuración la gestión de usuarios: crear, asignar rol (administrador, tesorero, secretario, profe), desactivar y "Generar contraseña" temporal que obligue a cambiarla en el primer ingreso. Aplicá permisos por rol en la API y ocultá en el menú lo que el rol no puede usar (el detalle de permisos lo defino yo: empezá con administrador todo, tesorero cuotas/cobros/tesorería/reportes/transparencia, secretario socios, profe solo lectura de socios). No toques otras pantallas.
```

---

## M2 – Socios y familias

### Paso 2.1 – API de socios y familias

- **Tareas:** CRUD de socios y familias; N° de socio automático; DNI único; tutor para menores; estados (activo, baja, vitalicio); búsqueda y filtros (nombre, DNI, N°, familia, categoría, estado, apto); cálculo de edad y estado del apto.
- **Listo cuando:** los tests de la API pasan, incluida la regla de DNI único.
- **Prompt:**

```
Implementá solo el backend de socios y familias: CRUD de socios (apellido, nombre, DNI único, nacimiento, categoría, familia, tutor, teléfono, estado, vencimiento de apto) y de familias (responsable de pago). N° de socio automático. Endpoint de listado con búsqueda por nombre/DNI/N°/familia y filtros por categoría, estado y apto (vigente, vencido, sin apto). Devolvé edad y estado del apto calculados. Agregá tests. Sin pantallas.
```

### Paso 2.2 – Pantalla Socios (listado)

- **Tareas:** pestañas Socios / Familias / Importar-exportar; buscador; filtros; contador; filas con N°, estado, edad y etiqueta de apto; botón **+ Nuevo socio**.
- **Listo cuando:** los filtros funcionan y se ve «1 socio activo» con la plantilla correcta de singular y plural.
- **Prompt:**

```
En apps/web creá la pantalla Socios con tres pestañas (Socios, Familias, Importar / exportar). En la pestaña Socios: título con contador ("1 socio activo"), botón "+ Nuevo socio", buscador "Nombre, DNI, N° de socio o familia", filtros de categoría, estado y apto médico, botón Buscar y lista con apellido y nombre, N°, estado, edad y etiqueta de apto (por ejemplo "Sin apto"). Usá la API ya hecha. Las otras pestañas quedan vacías por ahora.
```

### Paso 2.3 – Alta y edición de socio

- **Tareas:** formulario de alta y ficha de edición; selector de familia (existente o nueva); tutor si es menor; baja y vitalicio.
- **Listo cuando:** se crea un socio nuevo, aparece en el listado y se edita.
- **Prompt:**

```
Creá el formulario de alta y la ficha de edición de socio en apps/web: datos personales, categoría, familia (elegir existente o crear), tutor obligatorio si es menor de 18, teléfono, estado y vencimiento del apto médico. Validá con los esquemas Zod de packages/shared. Desde el botón "+ Nuevo socio" y desde cada fila del listado. No toques la pestaña Familias ni Importar.
```

### Paso 2.4 – Pestaña Familias

- **Tareas:** texto «Cada familia paga junta: un solo recibo y el descuento familiar»; buscador por nombre o DNI de quien paga; cada fila muestra N°, quien paga, nombre de familia y socios activos; detalle con sus socios.
- **Listo cuando:** se puede mover un socio de familia.
- **Prompt:**

```
Implementá la pestaña Familias en la pantalla Socios: texto explicativo "Cada familia paga junta: un solo recibo y el descuento familiar.", buscador "Nombre o DNI de quien paga", lista con número, responsable de pago, nombre de familia y socios activos, y una pantalla de detalle para cambiar el responsable y mover socios. No modifiques otras pestañas.
```

### Paso 2.5 – Plantilla Excel/CSV y exportar padrón

- **Tareas:** generar la planilla modelo con hoja de instrucciones y hoja de ejemplos (socio adulto, hermanos que pagan juntos, chicos con tutor, bajas, vitalicios); versión CSV; exportar el padrón en el mismo formato.
- **Listo cuando:** el Excel exportado se vuelve a abrir con las mismas columnas que la planilla modelo.
- **Prompt:**

```
Con ExcelJS generá en el backend: (1) planilla modelo .xlsx con una hoja de instrucciones y una hoja de ejemplos de todos los casos (socio adulto, hermanos que pagan juntos, chicos con tutor, bajas y vitalicios), (2) versión CSV, (3) exportación de todos los socios con exactamente las mismas columnas. Agregá en la pestaña "Importar / exportar" las tarjetas "1. Bajá la planilla modelo" con los botones "Planilla Excel (.xlsx)" y "Versión CSV", y "Exportar el padrón" con "Descargar padrón". Sin importación todavía.
```

### Paso 2.6 – Importar con vista previa

- **Tareas:** subir archivo; **Revisar planilla** valida y muestra la vista previa fila por fila (nueva, actualiza, error); confirmar guarda; DNI existente actualiza; filas con error no frenan al resto.
- **Listo cuando:** se importa el Excel de ejemplo y no se guarda nada hasta confirmar.
- **Prompt:**

```
Implementá la importación: en la pestaña "Importar / exportar" agregá "2. Subila completa" con selector de archivo y botón "Revisar planilla" con el texto "Todavía no se guarda nada: primero te mostramos cómo quedó cada fila. Si un socio ya está cargado (mismo DNI), se actualizan sus datos." El backend valida y devuelve la vista previa (nueva / actualiza / error con motivo por fila) sin guardar. Un botón "Confirmar importación" guarda solo las filas válidas. Agregá tests con la planilla modelo.
```

---

## M3 – Cuotas

### Paso 3.1 – Generación de cuotas (backend)

- **Objetivo:** el corazón del sistema.
- **Tareas:** endpoint para consultar cuántos socios activos no tienen cuota del mes y endpoint para generarlas; idempotente; importe según categoría; vencimiento día 10; descuento familiar según la regla definida.
- **Listo cuando:** ejecutarlo dos veces no duplica y los tests lo prueban.
- **Prompt:**

```
Implementá solo el backend de generación de cuotas: GET que informe para un período cuántos socios activos no tienen cuota, y POST que genere las faltantes. Debe ser idempotente (único socio + período), tomar el importe de la categoría, vencer el día configurado (por defecto 10) y registrar auditoría. Dejá el descuento familiar en una función aparte con un TODO, porque la regla exacta todavía no está definida. Agregá tests, incluido el de ejecución doble. Sin pantallas.
```

### Paso 3.2 – Pantalla Cuotas

- **Tareas:** selector de mes; bloque «Generar las cuotas de [mes]» con texto y botón **Generar n cuotas**; tarjetas Emitido, Cobrado, Falta cobrar y Cobrabilidad con barra.
- **Listo cuando:** tras generar, el Emitido se actualiza y el aviso de Inicio desaparece.
- **Prompt:**

```
Creá la pantalla Cuotas: selector de mes, bloque "Generar las cuotas de [mes]" que diga cuántos socios activos no tienen cuota, la fecha de vencimiento y "Se puede volver a tocar más adelante si se suman socios: nunca duplica", con botón "Generar n cuotas" (manejá singular y plural). Debajo, tarjetas Emitido (monto y cantidad), Cobrado (monto y cuotas saldadas), Falta cobrar y Cobrabilidad (porcentaje con barra). Backend de resumen del mes incluido. No incluyas todavía la lista de familias que deben.
```

### Paso 3.3 – Familias que deben y recordatorio

- **Tareas:** lista de familias con deuda de cualquier mes (monto, cantidad de cuotas, deuda desde); buscador; botones **Recordar** (wa.me con mensaje) y **Cobrar** (lleva a Cobros).
- **Listo cuando:** la familia con cuota vencida aparece con su monto y el botón Recordar abre WhatsApp.
- **Prompt:**

```
Agregá a Cuotas la sección "Familias que deben" (cuotas vencidas de cualquier mes): buscador, nombre de quien paga, monto adeudado, "n cuota(s) · debe desde dd/mm/aaaa", y dos botones: "Recordar" (abre un enlace wa.me al teléfono con un mensaje armado; si falta teléfono avisa) y "Cobrar" (navega a Cobros con la familia elegida). Backend del listado incluido. No implementes el cobro en sí.
```

---

## M4 – Cobros y recibos

### Paso 4.1 – Cobro de una familia (backend)

- **Tareas:** buscar familia por nombre del chico, de quien paga o DNI; endpoint de cobro que crea un recibo único, saldadas por antigüedad, con medio de pago y cuenta de destino; transaccional.
- **Listo cuando:** un cobro parcial y uno total dejan las cuotas en el estado correcto y el saldo de la cuenta sube.
- **Prompt:**

```
Implementá solo el backend de cobros: búsqueda de familia (por nombre del socio, de quien paga o DNI), endpoint que devuelva sus cuotas pendientes, y endpoint POST de cobro que en una transacción cree un recibo único (con numeración correlativa), sus ítems, salde cuotas empezando por las más viejas (permitir pago parcial) y acredite el importe en la cuenta elegida. Auditoría incluida. Tests de pago parcial y total. Sin pantallas.
```

### Paso 4.2 – Pantalla Cobros

- **Tareas:** «Cobrar a una familia» con buscador; detalle de deuda; elegir cuotas, medio de pago y cuenta; confirmar.
- **Listo cuando:** se cobra desde el botón Cobrar de Cuotas y la deuda baja.
- **Prompt:**

```
Creá la pantalla Cobros: título "Cobros", texto "Buscá la familia para cobrar, o mirá los recibos emitidos.", enlace "Avisos de pago del portal" (por ahora deshabilitado), tarjeta "Cobrar a una familia" con buscador "Nombre del chico, de quien paga o DNI", y el flujo de cobro: mostrar cuotas pendientes, elegir medio de pago y cuenta de destino, confirmar. Usá la API existente. No hagas la lista de recibos todavía.
```

### Paso 4.3 – Recibos emitidos, PDF y anulación

- **Tareas:** filtro Desde/Hasta y **Ver**; mensaje «No hay cobros entre esas fechas»; detalle del recibo; PDF con PDFKit; anular con motivo.
- **Listo cuando:** se descarga el PDF y un recibo anulado devuelve las cuotas a deuda.
- **Prompt:**

```
Agregá a Cobros la sección "Recibos emitidos": filtros Desde y Hasta, botón Ver, lista de recibos y el mensaje "No hay cobros entre esas fechas." cuando esté vacía. Detalle de recibo con descarga en PDF (PDFKit) con datos del club, escudo, número, familia, ítems y total. Agregá "Anular recibo" con motivo obligatorio: las cuotas vuelven a deuda y el ingreso se excluye de los totales, sin borrar nada. Tests de la anulación.
```

---

## M5 – Tesorería

### Paso 5.1 – Movimientos y saldos (backend)

- **Tareas:** CRUD de movimientos (gasto, ingreso, transferencia); saldo por cuenta calculado (saldo inicial + movimientos + cobros); anulación; totales Entró / Salió / Resultado que excluyen anulados y transferencias.
- **Listo cuando:** los tests de saldos pasan, incluida la transferencia que no altera el total.
- **Prompt:**

```
Implementá solo el backend de tesorería: movimientos de tipo gasto, ingreso y transferencia (importe entero, fecha, rubro, cuenta origen/destino, detalle, comprobante opcional, anulado). Saldo por cuenta calculado como saldo inicial + movimientos + cobros de cuotas; las transferencias mueven saldo pero no cuentan como ingreso ni gasto; los anulados se excluyen. Endpoint de listado con filtros (mes, tipo, cuenta, rubro, texto) y totales Entró/Salió/Resultado. Tests de saldos. Sin pantallas.
```

### Paso 5.2 – Formulario «Cargar movimiento»

- **Tareas:** selector **¿Qué es?** (Gasto, Ingreso, Transferencia) que cambia los campos; importe, fecha, rubro, cuentas, detalle; casilla «Después de guardar, cargar otro»; enlace a Configuración si falta un rubro.
- **Listo cuando:** se cargan los tres tipos y los saldos cambian.
- **Prompt:**

```
Creá la pantalla "Cargar movimiento" con selector "¿Qué es?" (Gasto, Ingreso, Transferencia). Gasto: importe, fecha, rubro, "Sale de la cuenta", detalle opcional. Ingreso: importe, fecha, "De dónde viene" (rubro), "Entra a la cuenta", detalle. Transferencia: importe, fecha, "Sale de la cuenta", "Va a la cuenta", detalle. Casilla "Después de guardar, cargar otro", botones Guardar y Cancelar, y el aviso "¿Falta un rubro? Agregalo en Configuración" con enlace. Sin comprobantes todavía.
```

### Paso 5.3 – Pantalla Tesorería

- **Tareas:** botones **+ Gasto**, **+ Ingreso**, **Transferir**; tarjetas deslizables por cuenta; filtros mes y tipo, **Más filtros**; Entró / Salió / Resultado; lista de movimientos; estado vacío con **Cargar un gasto**.
- **Listo cuando:** los movimientos cargados aparecen y los totales coinciden con los saldos.
- **Prompt:**

```
Creá la pantalla Tesorería: texto "La plata del club: cuánto hay en cada cuenta, qué entró y en qué se gastó.", botones "+ Gasto", "+ Ingreso" y "Transferir" (abren el formulario con el tipo preseleccionado), tarjetas horizontales deslizables con Total en cuentas y el saldo de cada cuenta (rojo si es negativo), filtros de mes y tipo, "Más filtros" desplegable, resumen Entró / Salió / Resultado, nota "Las transferencias entre cuentas no suman ni restan.", lista de movimientos con opción de anular, y el estado vacío "No hay movimientos con estos filtros." con botón "Cargar un gasto".
```

### Paso 5.4 – Comprobantes

- **Tareas:** adjuntar foto o PDF en el formulario; guardado privado; ver el comprobante solo con sesión de comisión.
- **Listo cuando:** la URL del archivo no abre sin sesión.
- **Prompt:**

```
Agregá comprobantes a los movimientos: campo "Comprobante (opcional)" con botón "Sacar foto o elegir archivo" (imagen o PDF, límite de tamaño) y el texto "Foto del ticket o la factura, o un PDF. Solo lo ve la comisión.". El backend guarda el archivo fuera de la carpeta pública y lo sirve únicamente a usuarios con sesión y rol autorizado. Mostrá un ícono de adjunto en la lista. No toques otros módulos.
```

### Paso 5.5 – Exportar tesorería a Excel

- **Tareas:** botón **Bajar planilla (Excel)** que respeta los filtros.
- **Listo cuando:** el archivo tiene movimientos, saldos por cuenta y totales.
- **Prompt:**

```
Agregá en Tesorería el botón "Bajar planilla (Excel)" que descargue con ExcelJS una planilla con los movimientos filtrados (fecha, tipo, rubro, cuenta, detalle, importe, comprobante sí/no) y una hoja con saldos por cuenta. Solo esto.
```

---

## M6 – Inicio (panel)

### Paso 6.1 – Datos del panel (backend)

- **Tareas:** un endpoint con socios activos y familias, cobrado del mes, deuda vencida y familias que deben, plata en cuentas y gastos del mes, aptos vencidos de socios activos, y el estado de «Primeros pasos».
- **Listo cuando:** los números coinciden con Socios, Cuotas y Tesorería.
- **Prompt:**

```
Creá el endpoint GET /api/inicio que devuelva: socios activos y cantidad de familias, cobrado del mes (cuotas y cobros), deuda vencida y cantidad de familias que deben, plata total en cuentas, gastos del mes, aptos médicos vencidos de socios activos, cuotas faltantes por generar del mes actual, y el estado de los 4 pasos de "Primeros pasos" (datos y escudo, valor de cuota por categoría, socios cargados, comisión con tesorero/secretario/profes). Reutilizá los servicios existentes. Tests. Sin pantalla.
```

### Paso 6.2 – Pantalla Inicio

- **Tareas:** saludo con nombre y fecha; aviso «Faltan generar n cuotas de [mes]» con enlace; seis tarjetas; checklist con tachado; tarjeta «Instalá el sistema en el celular».
- **Listo cuando:** se ve igual que las capturas de la demo, con los datos de Faro Norte.
- **Prompt:**

```
Creá la pantalla Inicio: "Hola, [nombre]" y "Así está el club hoy, dd/mm/aaaa."; aviso amarillo "Faltan generar n cuotas de [mes]" con enlace "Generarlas ahora" (solo si faltan); tarjetas Socios activos, Cobrado este mes, Deuda vencida (rojo), Plata en cuentas (rojo si es negativa) y Aptos médicos vencidos con enlace "ver"; tarjeta "Primeros pasos" con contador "n de 4" y ítems tachados al completarse; y la tarjeta "Instalá el sistema en el celular" con las instrucciones de Android e iPhone. Usá /api/inicio. Singular y plural correctos.
```

---

## M7 – Reportes

### Paso 7.1 – Reportes (backend)

- **Tareas:** endpoints para ingresos y gastos por rubro y período, serie mensual, cobranza por mes, morosos y resumen de socios; exportación a Excel.
- **Listo cuando:** los totales de un mes coinciden con Tesorería.
- **Prompt:**

```
Implementá solo el backend de Reportes: (1) ingresos y gastos por rubro para un período con superávit, plata en cuentas a la fecha y serie mensual de los últimos 12 meses, (2) cobranza por mes (emitido, cobrado, porcentaje), (3) morosos (familia, monto, antigüedad), (4) resumen de socios (altas, bajas, por categoría, aptos). Excluí movimientos anulados y transferencias. Agregá exportación a Excel con una hoja por reporte. Tests de totales.
```

### Paso 7.2 – Pantalla Reportes

- **Tareas:** pestañas Ingresos y gastos, Cobranza, Morosos y Socios; selector de período; gráfico **Mes a mes** con Recharts; «Ver los números»; botón **Bajar planilla (Excel)**.
- **Listo cuando:** el gráfico muestra barras de ingresos y gastos y la tabla coincide.
- **Prompt:**

```
Creá la pantalla Reportes con el texto "Para la reunión de comisión, la asamblea o para saber cómo viene el club.", botón "Bajar planilla (Excel)" y pestañas Ingresos y gastos, Cobranza, Morosos y Socios. En Ingresos y gastos: selector de período, tarjetas Ingresos, Gastos y Superávit con "Plata en cuentas al dd/mm/aaaa", listas de ingresos y gastos por rubro (con "No hubo ingresos/gastos en este período." si está vacío), gráfico de barras Mes a mes con Recharts (ingresos azul, gastos naranja) y desplegable "Ver los números" con la tabla. Cerrá con la nota "No incluye movimientos anulados ni las transferencias entre cuentas del club."
```

---

## M8 – Transparencia

### Paso 8.1 – Configuración y API pública

- **Tareas:** guardar las opciones (publicada, mostrar desde, qué se muestra, mensaje); endpoint público de solo lectura con **lista blanca de campos**; rubros privados agrupados en «Otros»; respuesta cuando no está publicada.
- **Listo cuando:** un test comprueba que la respuesta nunca incluye nombres, DNI, teléfonos, fotos ni comprobantes.
- **Prompt:**

```
Implementá el backend de transparencia: guardar opciones (publicada, mostrar desde mes/año, mostrar porcentaje cobrado sin nombres, cantidad de socios y familias, plata total en cuentas, detalle de gastos, mensaje de la comisión) y un endpoint público sin login GET /api/publico/transparencia construido con lista blanca de campos. Los rubros privados se suman en "Otros" sin alterar los totales. Para los gastos solo se indica si tienen comprobante, nunca el archivo. Si no está publicada, devolvé un estado "no publica por ahora". Escribí tests que verifiquen que no se filtra ningún dato personal.
```

### Paso 8.2 – Pantalla de administración

- **Tareas:** tarjeta de estado **Pública**, link, **Ver la página**, **Copiar link**, **Compartir por WhatsApp**; casilla **Publicar la página**; «Mostrar desde»; «Qué más se muestra»; mensaje de la comisión; **Guardar**; bloque «Qué nunca se publica» con enlace a **Elegir rubros privados**.
- **Listo cuando:** guardar cambia lo que devuelve la API pública.
- **Prompt:**

```
Creá la pantalla Transparencia (administración): texto "Una página pública con lo que entra y en qué se gasta la plata del club. Las familias la ven sin usuario ni contraseña, y genera confianza para pagar la cuota.", tarjeta de estado con etiqueta Pública y el link, botones "Ver la página", "Copiar link" y "Compartir por WhatsApp", casilla "Publicar la página" ("Si la apagás, el link muestra que el club no publica sus cuentas por ahora."), selector "Mostrar desde", casillas de "Qué más se muestra" con el aviso de revisar datos personales en el detalle de gastos, campo "Mensaje de la comisión (opcional)", botón Guardar y el bloque "Qué nunca se publica" con enlace "Elegir rubros privados".
```

### Paso 8.3 – Página pública

- **Tareas:** ruta pública `/transparencia` sin login, liviana y legible en el celular; muestra solo lo habilitado.
- **Listo cuando:** se abre en una ventana de incógnito y respeta lo elegido.
- **Prompt:**

```
Creá la página pública /transparencia en apps/web (fuera de las rutas protegidas): escudo y nombre del club, mensaje de la comisión, porcentaje de cuotas cobradas del mes, cantidad de socios y familias, plata total en cuentas, ingresos y gastos por rubro y el detalle de gastos (fecha, rubro, detalle e importe), mostrando solo lo habilitado en la configuración. Si el club no publica, mostrá el aviso correspondiente. Diseño liviano, mobile-first, sin menú de administración.
```

---

## M9 – Cierre y producción

### Paso 9.1 – Auditoría

- **Tareas:** pantalla de solo lectura (administrador) con quién hizo qué y cuándo; verificar que cobros, anulaciones, importaciones y cambios de configuración queden registrados.
- **Prompt:**

```
Revisá que cobros, anulaciones, importaciones, generación de cuotas, cambios de configuración y de usuarios escriban en la tabla auditoria (usuario, acción, entidad, fecha, detalle). Agregá lo que falte y una pantalla de solo lectura para el administrador con filtros por fecha y usuario. No cambies otras funciones.
```

### Paso 9.2 – Seguridad y respaldo

- **Tareas:** HTTPS, cabeceras de seguridad (helmet), protección CSRF, límites de subida; script de backup diario de base y archivos, y de restauración.
- **Prompt:**

```
Reforzá la seguridad del backend: helmet, protección CSRF con cookies, límites de tamaño y tipo de archivos subidos, y rate limit global. Creá scripts backup.sh y restore.sh que guarden la base y la carpeta de archivos con fecha. Documentá en README cómo programarlos a diario. No cambies funcionalidad.
```

### Paso 9.3 – Despliegue

- **Tareas:** pasar a PostgreSQL en producción; build; servidor con Nginx y PM2 (o PaaS); variables de entorno; dominio y HTTPS.
- **Prompt:**

```
Preparame el despliegue: soporte de PostgreSQL en producción manteniendo SQLite en desarrollo (misma capa Drizzle y migraciones), script de build, archivo de configuración de PM2, ejemplo de configuración de Nginx con HTTPS, y un README de despliegue paso a paso con las variables de entorno. No cambies funcionalidad.
```

### Paso 9.4 – Datos reales y capacitación

- **Tareas:** cargar categorías y cuentas reales, importar el padrón del club, generar el primer mes, probar un cobro real, publicar la transparencia; hacer una guía de una hoja para la comisión.
- **Listo cuando:** la comisión puede cobrar una cuota y ver el reporte del mes sin ayuda.

---

## M10 – Portal de familias (fase posterior)

### Paso 10.1 – Portal y avisos de pago

- **Tareas:** acceso de la familia (por DNI y código o link), ver deuda y recibos, informar un pago con comprobante; la comisión lo confirma desde **Avisos de pago del portal** (CU-26).
- **Prompt (cuando llegue el momento):**

```
Implementá el portal de familias: acceso por DNI del responsable de pago más un código enviado por WhatsApp o definido por la comisión, pantalla con deuda y recibos de su familia únicamente, y botón "Avisar un pago" con importe, fecha y comprobante. En Cobros, activá "Avisos de pago del portal" para que la comisión confirme (genera el cobro) o rechace. Una familia nunca debe ver datos de otra. Tests de aislamiento.
```

---

## Decisiones que conviene cerrar antes de los pasos marcados

| Decisión | Se necesita en el paso |
|---|---|
| Cómo se calcula el descuento familiar (porcentaje, monto fijo o por cantidad de hijos) | 3.1 |
| Permisos exactos de cada rol, en especial los profes | 1.3 |
| Formato y numeración de los recibos | 4.1 y 4.3 |
| Si se permiten saldos negativos en cuentas y cómo se cargan los saldos iniciales | 1.2 y 5.1 |
| Dónde se aloja el sistema y qué dominio usa | 9.3 |
| Si el portal de familias entra en el primer lanzamiento | 10.1 |
