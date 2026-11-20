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
- Producción: Render / Railway (PaaS cloud). SQLite en desarrollo, PostgreSQL en producción.
- Los profes pueden ver todos los socios activos (sin restricción por disciplina).
- El descuento familiar se deja con TODO (regla exacta no definida todavía).
