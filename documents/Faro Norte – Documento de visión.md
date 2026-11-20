# Faro Norte – Documento de visión

Sistema web de gestión para el club de barrio Faro Norte · Versión 0.1 · 03/11/2026

## 1. Resumen

Faro Norte Gestión es una aplicación web (instalable en el celular como PWA) para que la comisión y el personal del club administren socios, cuotas, cobros y tesorería, y para que las familias puedan ver con transparencia en qué se usa la plata del club. Está pensada para usarse principalmente desde el celular, con pocas pantallas, lenguaje simple (español rioplatense, trato de «vos») y cero conocimientos contables.

Este documento toma como referencia la demo que se ve en las capturas (Club de Barrio) y la adapta a un único club: **Faro Norte**. Todo lo que aparece en esas capturas debe existir en la versión final.

## 2. Problema que resuelve

- Los socios, las cuotas y los pagos viven en planillas de Excel, cuadernos y chats de WhatsApp.
- Es difícil saber quién debe, cuánto, desde cuándo, y cuánta plata hay realmente en cada cuenta (caja, banco, Mercado Pago, cantina).
- Las familias con varios hijos pagan juntas y reciben un solo recibo, pero hoy se calcula a mano.
- Las familias no ven en qué se gasta la plata, lo que baja la confianza y la cobrabilidad.
- Los aptos médicos vencidos pasan desapercibidos.

## 3. Objetivos

1. Tener el padrón de socios y familias ordenado, importable desde Excel y exportable en cualquier momento.
2. Generar las cuotas de cada mes con un solo botón, sin duplicar nunca.
3. Cobrar a una familia en pocos toques y emitir un recibo único.
4. Llevar la tesorería real: gastos, ingresos no vinculados a cuotas y transferencias entre cuentas.
5. Entregar reportes listos para la reunión de comisión o la asamblea.
6. Publicar una página pública de transparencia, sin usuario ni contraseña, que cuida los datos personales.
7. Funcionar bien en celulares de gama media y con conexión irregular.

## 4. Fuera de alcance (por ahora)

- Aplicación móvil nativa (se usa PWA; no Flutter).
- Multi-club o venta del sistema a otros clubes: la versión es de un solo club, aunque el código se deja ordenado para poder escalar más adelante.
- Facturación electrónica fiscal (AFIP/ARCA) y contabilidad formal.
- Cobro online integrado con pasarela de pago (se evalúa en fase posterior).

## 5. Usuarios y roles

| Rol | Quién es | Qué puede hacer |
| --- | --- | --- |
| Administrador | Presidente o responsable del sistema | Todo, incluida Configuración, usuarios de la comisión y generación de contraseñas nuevas |
| Tesorero | Miembro de la comisión | Cuotas, cobros, tesorería, reportes, transparencia |
| Secretario | Miembro de la comisión | Socios, familias, importación, aptos médicos |
| Profe | Personal deportivo | Ver socios y estado de apto médico, según permisos |
| Familia (portal) | Quien paga por un socio | Ver su deuda y avisar un pago (fase posterior) |
| Público | Cualquier persona con el link | Ver la página de transparencia |

El login es «Ingreso de la comisión y el personal» con email y contraseña. Si alguien olvida la contraseña, el administrador del club le genera una nueva (no hay recuperación automática por email en la primera versión).

## 6. Alcance funcional por módulo

### 6.1 Acceso (login)

- Pantalla con escudo del club, nombre «Faro Norte», subtítulo «Ingreso de la comisión y el personal», campos Email y Contraseña, botón **Entrar**.
- Texto de ayuda: «¿Olvidaste la contraseña? Pedile al administrador del club que te genere una nueva.»
- Banner de instalación de la app (PWA) en el navegador.
- Encabezado con ícono de candado (bloquear/cambiar contraseña) y botón de salir.

### 6.2 Inicio (panel)

- Saludo personalizado («Hola, Javier») y fecha de hoy.
- Aviso cuando faltan generar cuotas del mes, con enlace «Generarlas ahora».
- Tarjetas de resumen: **Socios activos** (y cantidad de familias), **Cobrado este mes** (cuotas y cobros), **Deuda vencida** (y cuántas familias deben), **Plata en cuentas** (con gastos del mes) y **Aptos médicos vencidos** (de socios activos, con enlace para verlos).
- Los montos negativos o de deuda se resaltan en rojo.
- Checklist «Primeros pasos» (n de 4): completar datos del club y subir el escudo; poner el valor de la cuota por categoría; cargar los socios (o importar el Excel); sumar a la comisión (tesorero, secretario, profes).
- Tarjeta «Instalá el sistema en el celular» con instrucciones para Android (Instalar app / Agregar a pantalla de inicio) e iPhone (Compartir → Agregar a inicio).

### 6.3 Socios

Tres pestañas: **Socios**, **Familias** e **Importar / exportar**.

**Socios**

- Listado con contador («1 socio activo») y botón **+ Nuevo socio**.
- Buscador por nombre, DNI, N° de socio o familia.
- Filtros: categoría, estado (Activos, bajas, vitalicios) y apto médico (todos, vigente, vencido, sin apto) más botón Buscar.
- Cada fila muestra apellido y nombre, N° de socio, estado, edad y una etiqueta de apto médico (por ejemplo «Sin apto»).
- Ficha del socio: datos personales, DNI, fecha de nacimiento, categoría, familia, tutor (para menores), teléfono, foto, apto médico (fecha de vencimiento), estado.

**Familias**

- Texto explicativo: «Cada familia paga junta: un solo recibo y el descuento familiar.»
- Buscador por nombre o DNI de quien paga.
- Cada familia muestra número, quien paga, nombre de familia y socios activos.

**Importar / exportar**

1. Descargar planilla modelo (Excel .xlsx o CSV) con instrucciones y una hoja de ejemplos de todos los casos: socio adulto, hermanos que pagan juntos, chicos con tutor, bajas y vitalicios.
2. Subir la planilla completa y **Revisar planilla**: primero se muestra cómo quedó cada fila (vista previa), sin guardar nada. Si el DNI ya existe, se actualizan los datos.
3. **Exportar el padrón**: descarga todos los socios en el mismo formato de la planilla, para corregir en Excel y volver a importar.

### 6.4 Cuotas

- Selector de mes (por ejemplo «Noviembre 2026»).
- Bloque **Generar las cuotas del mes**: indica cuántos socios activos no tienen la cuota, la fecha de vencimiento (día 10) y avisa que se puede volver a ejecutar más adelante si se suman socios porque nunca duplica. Botón «Generar n cuotas».
- Tarjetas del mes: **Emitido** (monto y cantidad de cuotas), **Cobrado** (monto y cuotas saldadas), **Falta cobrar** y **Cobrabilidad** (porcentaje con barra de progreso).
- Lista **Familias que deben**, con cuotas vencidas de cualquier mes: buscador, nombre, monto adeudado, cantidad de cuotas, fecha desde la que debe y acciones **Recordar** (mensaje por WhatsApp) y **Cobrar**.

### 6.5 Cobros

- Buscador «Cobrar a una familia» por nombre del chico, de quien paga o DNI.
- Enlace «Avisos de pago del portal» (pagos informados por las familias, a confirmar por la comisión).
- **Recibos emitidos**: filtro Desde/Hasta, botón Ver y listado; mensaje «No hay cobros entre esas fechas» cuando está vacío.
- Cobrar genera un recibo único por familia, con descuento familiar aplicado, medio de pago y cuenta de destino.

### 6.6 Tesorería

- Descripción: la plata del club, cuánto hay en cada cuenta, qué entró y en qué se gastó.
- Acciones rápidas: **+ Gasto**, **+ Ingreso**, **Transferir**.
- Tarjetas deslizables con el saldo por cuenta: Total en cuentas, Caja efectivo, Banco, Mercado Pago y Cantina / Buffet (las cuentas son configurables).
- Filtros por mes y tipo (Todo, gastos, ingresos, transferencias) y «Más filtros».
- Resumen del período: **Entró**, **Salió** y **Resultado**. Las transferencias entre cuentas no suman ni restan.
- Listado de movimientos; estado vacío «No hay movimientos con estos filtros» con botón **Cargar un gasto**.
- **Bajar planilla (Excel)** de los movimientos.

**Cargar movimiento** (formulario único con selector «¿Qué es?»)

- **Gasto**: importe, fecha, rubro, sale de la cuenta, detalle opcional, comprobante opcional.
- **Ingreso** (no de cuotas: buffet, rifa, sponsor): importe, fecha, «De dónde viene» (rubro), «Entra a la cuenta», detalle opcional, comprobante.
- **Transferencia**: importe, fecha, «Sale de la cuenta», «Va a la cuenta», detalle, comprobante.
- Comprobante opcional: sacar foto o elegir archivo (foto o PDF); solo lo ve la comisión.
- Casilla «Después de guardar, cargar otro», botones **Guardar** y **Cancelar**.
- Enlace a Configuración si falta un rubro.

### 6.7 Reportes

- Pensados para la reunión de comisión y la asamblea. Botón **Bajar planilla (Excel)**.
- Cuatro pestañas: **Ingresos y gastos**, **Cobranza**, **Morosos** y **Socios**.
- Ingresos y gastos: selector de período; tarjetas Ingresos, Gastos y Superávit; «Plata en cuentas al día»; detalle de ingresos y gastos por rubro; gráfico **Mes a mes** (barras de ingresos vs. gastos) con la opción «Ver los números» para ver la tabla; nota de que no incluye movimientos anulados ni transferencias.
- Cobranza: emitido, cobrado y porcentaje por mes.
- Morosos: familias con deuda, monto y antigüedad.
- Socios: altas, bajas, categorías y aptos médicos.

### 6.8 Transparencia

- Página pública (sin usuario ni contraseña) que muestra lo que entra y en qué se gasta la plata del club.
- Panel de administración con estado **Pública**, link de la página, botones **Ver la página**, **Copiar link** y **Compartir por WhatsApp**.
- Opciones: **Publicar la página** (si se apaga, el link informa que el club no publica sus cuentas por ahora), **Mostrar desde** (mes de inicio), y qué más se muestra: porcentaje de cuotas cobradas del mes (sin nombres), cantidad de socios y familias, plata total en las cuentas y el detalle de cada gasto (con aviso para revisar que no haya datos personales).
- **Mensaje de la comisión** opcional, con botón **Guardar**.
- Regla de privacidad visible: **nunca se publican** nombres de socios, familias o deudores, DNI, teléfonos y fotos; los comprobantes (solo se indica si el gasto tiene uno); los rubros marcados como privados se suman en «Otros» para que los totales sigan siendo reales, con enlace «Elegir rubros privados».

### 6.9 Configuración

Aparece en el menú y se enlaza desde otras pantallas. Incluye:

- Datos del club y escudo.
- Categorías y valor de la cuota de cada una; descuento familiar; día de vencimiento (hoy, el 10).
- Cuentas de tesorería (Caja efectivo, Banco, Mercado Pago, Cantina / Buffet).
- Rubros de ingresos y gastos, con la marca de privado.
- Usuarios de la comisión y personal, roles y generación de contraseñas nuevas.

### 6.10 Navegación y experiencia móvil

- Barra inferior fija: Inicio, Socios, Cuotas, Cobros y Más.
- Menú lateral: Inicio, Socios, Cuotas, Cobros, Tesorería, Reportes, Transparencia y Configuración, con el pie «Club de Barrio» (en nuestra versión: «Faro Norte»).
- Encabezado con menú, escudo y nombre del club, candado y salir.
- Instalable como PWA, con ícono y nombre del club.

## 7. Reglas de negocio clave

1. Cada socio pertenece a una familia; quien paga es el responsable de pago de la familia.
2. La cuota depende de la categoría del socio; las familias reciben descuento familiar.
3. Generar cuotas es **idempotente**: crea solo las que faltan para los socios activos del mes y nunca duplica.
4. Las cuotas vencen el día 10 del mes (configurable). Deuda vencida = cuotas impagas con vencimiento pasado.
5. Un cobro a una familia emite un único recibo y salda cuotas empezando por las más antiguas; el ingreso entra a una cuenta de tesorería.
6. Los movimientos anulados no se borran: quedan marcados y se excluyen de los totales.
7. Las transferencias entre cuentas mueven saldo pero no cuentan como ingreso ni gasto.
8. Los saldos negativos se permiten pero se destacan, porque pueden indicar errores de carga.
9. Importar por DNI: si existe, actualiza; si no, crea. Siempre hay vista previa antes de guardar.
10. Apto médico vencido solo se evalúa para socios activos.
11. Todo dato personal queda fuera de la página pública; los rubros privados se agrupan en «Otros».
12. Cada acción relevante (cobro, anulación, cambio de configuración) queda en un registro de auditoría con usuario y fecha.

## 8. Modelo de datos inicial

- **usuarios** (id, nombre, email, hash de contraseña, rol, activo)
- **club** (única fila: nombre, escudo, datos de contacto, día de vencimiento, descuento familiar, configuración de transparencia)
- **categorias** (id, nombre, valor de cuota)
- **familias** (id, número, responsable de pago)
- **socios** (id, número, apellido, nombre, DNI único, nacimiento, categoría, familia, tutor, teléfono, foto, estado, fecha de vencimiento del apto médico)
- **cuotas** (id, socio o familia, período, importe, vencimiento, estado, único por socio y período)
- **recibos** (id, número, familia, fecha, total, medio de pago, cuenta, anulado)
- **recibo\_items** (recibo, cuota, importe aplicado)
- **cuentas** (id, nombre, tipo, saldo inicial)
- **rubros** (id, nombre, tipo ingreso o gasto, privado)
- **movimientos** (id, tipo gasto/ingreso/transferencia, fecha, importe, rubro, cuenta origen, cuenta destino, detalle, comprobante, anulado)
- **avisos\_de\_pago** (id, familia, importe, fecha, comprobante, estado)
- **auditoria** (id, usuario, acción, entidad, fecha, detalle)

El saldo de cada cuenta se calcula a partir de saldo inicial + movimientos + cobros, no se guarda como dato editable.

## 9. Arquitectura y stack propuesto

Restricción: backend en **Node.js**, sin Flutter y pensando en una computadora de desarrollo con pocos recursos.

| Capa | Propuesta | Motivo |
| --- | --- | --- |
| Lenguaje | TypeScript | Menos errores en reglas de dinero |
| Backend | Node.js 22 LTS + Fastify | Liviano, rápido, validación incluida |
| Base de datos | PostgreSQL en producción (Neon o VPS); SQLite para desarrollo local | SQLite no consume casi nada en tu PC; con Drizzle ORM se cambia de motor sin reescribir |
| ORM y migraciones | Drizzle ORM | Liviano, SQL tipado |
| Frontend | React + Vite + Tailwind CSS, como PWA | Mobile-first, ecosistema grande, build rápido |
| Formularios y validación | React Hook Form + Zod (esquemas compartidos con el backend) | Un solo esquema para front y back |
| Excel y CSV | ExcelJS y csv-parse | Plantillas, importación con vista previa y exportes |
| PDF de recibos | PDFKit | Recibo imprimible o compartible |
| Gráficos | Recharts | Gráfico «Mes a mes» |
| Autenticación | Sesiones con cookie httpOnly y argon2 | Simple y seguro |
| Archivos (comprobantes y escudo) | Disco del servidor o almacenamiento tipo S3, con acceso solo para la comisión | Privacidad de los comprobantes |
| Recordatorios | Enlaces wa.me con mensaje armado | Sin costo ni API de WhatsApp al inicio |
| Despliegue | VPS chico con Nginx y PM2, o un PaaS como Render o Railway | Costo bajo |

Estructura sugerida: un monorepo con `apps/api` (Node), `apps/web` (React PWA) y `packages/shared` (tipos y esquemas Zod).

Alternativa más liviana si la PC sufre: una sola aplicación Node con vistas renderizadas en el servidor y HTMX, sin build de frontend. Se pierde algo de fluidez de PWA pero se simplifica mucho.

## 10. Requisitos no funcionales

- **Rendimiento**: pantallas principales cargan en menos de 3 s en 4G.
- **Responsive y accesibilidad**: se diseña primero para pantallas de 360 px; botones grandes, buen contraste.
- **Seguridad**: HTTPS, contraseñas con argon2, protección CSRF y límite de intentos de login, permisos por rol, comprobantes no públicos.
- **Privacidad**: cumplimiento de la Ley 25.326 de Protección de Datos Personales (Argentina); datos de menores tratados con especial cuidado; la página pública nunca expone datos personales.
- **Respaldo**: backup diario automático de la base y de los archivos, con prueba de restauración.
- **Disponibilidad y offline**: la PWA abre rápido; se guarda en caché la interfaz y se muestra un aviso claro si no hay conexión (carga offline de datos queda para más adelante).
- **Auditabilidad**: nada de dinero se borra; se anula con registro.
- **Idioma y formato**: español rioplatense, moneda en pesos con separador de miles con punto (por ejemplo $ 18.000), fechas dd/mm/aaaa.
- **Calidad**: pruebas automáticas para generación de cuotas, cobros, saldos y reportes.

## 11. Hoja de ruta por fases

**Fase 0 – Base (1 semana)**: repositorio, TypeScript, base de datos, migraciones, login, roles, layout mobile con barra inferior y menú, PWA instalable, identidad visual de Faro Norte.

**Fase 1 – Socios (2 semanas)**: socios, familias, categorías, apto médico, plantilla Excel/CSV, importación con vista previa y exportación del padrón.

**Fase 2 – Cuotas y cobros (2 semanas)**: generación de cuotas idempotente, deuda vencida, cobros por familia, recibos con PDF, lista de familias que deben, recordatorio por WhatsApp.

**Fase 3 – Tesorería (2 semanas)**: cuentas, rubros, gastos, ingresos, transferencias, comprobantes, anulaciones, resumen del período y exportación a Excel.

**Fase 4 – Panel y reportes (1,5 semanas)**: pantalla de Inicio con tarjetas y «Primeros pasos», reportes de ingresos y gastos, cobranza, morosos y socios, gráfico Mes a mes.

**Fase 5 – Transparencia y configuración (1,5 semanas)**: página pública, opciones de publicación, rubros privados, mensaje de la comisión, compartir por WhatsApp, pantalla de Configuración completa.

**Fase 6 – Pulido y puesta en producción (1 semana)**: pruebas, backups, seguridad, carga de datos reales de Faro Norte y capacitación a la comisión.

**Fase 7 – Posteriores**: portal de familias con avisos de pago, cobro online (Mercado Pago), notificaciones, modo offline, multi-club si hiciera falta.

Los tiempos son una estimación para una persona desarrollando a medio tiempo y se ajustan al ritmo real.

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Errores en cálculos de dinero | Importes en centavos como enteros, pruebas automáticas, auditoría |
| Publicar datos personales por accidente | Lista blanca de campos públicos, aviso al marcar el detalle de gastos, revisión previa |
| Pérdida de datos | Backups diarios y restauración probada |
| Resistencia de la comisión al cambio | Importación desde Excel, pantallas simples, capacitación breve |
| PC de desarrollo limitada | SQLite local, Vite, evitar Docker y herramientas pesadas |
| Alcance que crece | Fases cerradas y backlog para lo posterior |

## 13. Detalles de la demo a revisar

Al comparar las capturas aparecieron cosas que conviene resolver en nuestra versión:

- Textos como «Faltan generar 1 cuotas» y «Generar 1 cuotas» necesitan manejo de singular y plural.
- «Plata en cuentas» aparece en negativo (-$ 8.000) y la cuenta Banco en -$ 25.000 mientras Mercado Pago tiene $ 10.000 y la caja $ 7.000: conviene definir si se permiten saldos negativos y cómo se cargan los saldos iniciales.
- El gráfico Mes a mes muestra gastos mayores que ingresos en octubre aunque el mes de noviembre figura en $ 0; hay que definir con claridad qué meses se incluyen y qué pasa con meses sin datos.
- El nombre «Club de Barrio» queda en el pie del menú: en nuestra versión se reemplaza por Faro Norte, o por «Gestión Faro Norte».
- La pestaña «Importar / exportar» y los filtros se cortan en pantallas chicas: revisar el responsive.

## 14. Decisiones pendientes

1. ¿SQLite o PostgreSQL desde el inicio en producción?
2. ¿React PWA o Node con vistas en servidor (HTMX)?
3. ¿Dónde se va a alojar (VPS propio, Render, Railway, hosting compartido con Node)?
4. ¿Cuántos usuarios y qué permisos exactos tiene cada rol (en especial los profes)?
5. ¿El descuento familiar es porcentaje, monto fijo o por cantidad de hijos?
6. ¿Los recibos llevan numeración correlativa propia y formato definido por la comisión?
7. ¿El portal de familias entra en el primer lanzamiento o queda para después?
8. ¿Qué dominio y qué dirección pública va a tener la página de transparencia?

## 15. Criterios de éxito

- La comisión carga o importa todo el padrón de Faro Norte en una sola tarde.
- Generar las cuotas del mes y cobrar a una familia lleva menos de un minuto.
- La comisión llega a la reunión mensual con los reportes sin tener que armar nada a mano.
- La página de transparencia está publicada y compartida por WhatsApp, sin ningún dato personal expuesto.
- Todos los módulos y pantallas de las capturas existen y funcionan en el celular.
