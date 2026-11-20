# Guía de Despliegue en Render con Base de Datos en Supabase — Club Faro Norte

Esta guía explica cómo desplegar el sistema en **Render** (aplicación web) conectado a tu base de datos PostgreSQL en **Supabase** (almacenamiento en la nube).

---

## Paso 1: Configurar la Base de Datos en Supabase

1. Entrá en [supabase.com](https://supabase.com/) e iniciá sesión (o creá cuenta gratuita).
2. Creá un nuevo proyecto:
   - **Name**: `faronorte-db`
   - **Database Password**: Elegí una contraseña segura y anotala.
   - **Region**: South America (São Paulo) o la más cercana.
3. Una vez creado el proyecto, andá al menú lateral **SQL Editor**.
4. Hacé clic en **New query**, abrí el archivo [`documents/supabase_setup.sql`](./supabase_setup.sql), copiá todo su contenido y pegalo en el editor.
5. Hacé clic en **Run**. En 2 segundos creará todas las tablas con sus relaciones e insertará los datos institucionales iniciales (club, categorías oficiales, cuentas, rubros y familias).
6. Andá a **Project Settings** (ícono de engranaje) → **Database**.
7. En la sección **Connection string**, seleccioná **URI** (modo `Session` o `Transaction`, preferentemente `Session` puerto 5432 o `Transaction` puerto 6543) y copiá la URL, reemplazando `[YOUR-PASSWORD]` por la contraseña que creaste.
   Ejemplo:
   `postgresql://postgres:[TU-PASSWORD]@db.[REF].supabase.co:5432/postgres`

---

## Paso 2: Desplegar la Aplicación en Render

El repositorio ya está en GitHub: `https://github.com/Araujogaelmdq/Gestion-FaroNorte` y cuenta con `render.yaml`.

### Opción Rápida con Blueprint:
1. En [dashboard.render.com](https://dashboard.render.com/), tocá **New +** → **Blueprint**.
2. Conectá el repositorio `Araujogaelmdq/Gestion-FaroNorte`.
3. Render leerá el archivo `render.yaml`.
4. En las variables de entorno, cambiá `DATABASE_URL` pegando la URL de conexión de Supabase del Paso 1.
5. Hacé clic en **Apply**. Render compilará el backend Fastify y el frontend React PWA y te dará tu enlace público: `https://faronorte-gestion.onrender.com`.

### Opción Manual como Web Service:
1. En el Dashboard de Render: **New +** → **Web Service**.
2. Seleccioná el repositorio `Gestion-FaroNorte`.
3. Configurá:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: `Free`
4. En **Environment Variables**:
   - `NODE_ENV`: `production`
   - `HOST`: `0.0.0.0`
   - `SESSION_SECRET`: Una clave segura de más de 32 caracteres
   - `DATABASE_URL`: Tu URI de Supabase (`postgresql://postgres:...@...supabase.co:5432/postgres`)
5. Tocá **Create Web Service**.

---

## Paso 3: Ingreso y Uso del Sistema

1. Abrí la URL que te asignó Render: `https://faronorte-gestion.onrender.com`
2. Ingresá con las credenciales iniciales:
   - **Email**: `admin@faronorte.club`
   - **Contraseña**: `Admin1234!`
3. Desde **Configuración** podés crear a los demás operadores del club (tesoreros, secretarios, profesores) con sus claves provisorias.
4. El portal público de transparencia queda visible para toda la comunidad sin login en:
   `https://faronorte-gestion.onrender.com/transparencia`

   - **Email**: `admin@faronorte.club`
   - **Contraseña**: `Admin1234!`
3. Desde la sección **Configuración** podés crear a los demás integrantes de la comisión (tesorero, secretario, profes) y asignarles sus claves.
4. El portal de transparencia queda disponible públicamente sin necesidad de login en:
   `https://faronorte-gestion.onrender.com/transparencia`

