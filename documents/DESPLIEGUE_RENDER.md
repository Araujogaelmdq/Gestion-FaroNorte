# Guía de Despliegue en Render — Club Faro Norte

Esta guía explica cómo subir el sistema de gestión del Club Faro Norte a **Render** (https://render.com) en menos de 5 minutos, de forma gratuita o con plan inicial.

---

## Opción A: Despliegue con 1 Clic usando `render.yaml` (Recomendada)

El proyecto ya incluye el archivo `render.yaml` (Blueprint de Render).

1. Subí este proyecto a un repositorio en **GitHub** o **GitLab**.
2. Entrá en [dashboard.render.com](https://dashboard.render.com/) e iniciá sesión con tu cuenta de GitHub.
3. Hacé clic en **New +** (arriba a la derecha) y seleccioná **Blueprint**.
4. Conectá el repositorio del proyecto.
5. Render detectará automáticamente el archivo `render.yaml`:
   - Creará el Web Service `faronorte-gestion`.
   - Asignará los comandos de Build (`npm install && npm run build`) y Start (`npm run start`).
   - Generará automáticamente un `SESSION_SECRET` seguro.
6. Hacé clic en **Apply**. Render compilará el backend y el frontend y te dará una URL pública del tipo:
   `https://faronorte-gestion.onrender.com`

---

## Opción B: Creación manual del Web Service

Si preferís configurarlo paso a paso desde el panel de Render:

1. En el Dashboard de Render, tocá **New +** → **Web Service**.
2. Seleccioná tu repositorio de GitHub.
3. Completá los campos:
   - **Name**: `faronorte-gestion`
   - **Region**: La más cercana (ej: `Oregon` o `Frankfurt`)
   - **Branch**: `main` (o tu rama de trabajo)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: `Free` (o `Starter` si querés disco persistente)
4. En **Advanced** → **Environment Variables**, agregá:
   - `NODE_ENV`: `production`
   - `HOST`: `0.0.0.0`
   - `SESSION_SECRET`: Una clave larga de al menos 32 caracteres (ej: `faronorte-super-secreto-seguridad-2026-clave!`)
   - `DATABASE_URL`: `sqlite.db` (o si creaste una base PostgreSQL en Render, pegás acá la Internal Database URL `postgres://...`)
5. Tocá **Create Web Service**.

---

## ¿Cómo acceder al sistema una vez desplegado?

1. Abrí la URL que te asigna Render: `https://faronorte-gestion.onrender.com`
2. Ingresá con las credenciales maestras iniciales:
   - **Email**: `admin@faronorte.club`
   - **Contraseña**: `Admin1234!`
3. Desde la sección **Configuración** podés crear a los demás integrantes de la comisión (tesorero, secretario, profes) y asignarles sus claves.
4. El portal de transparencia queda disponible públicamente sin necesidad de login en:
   `https://faronorte-gestion.onrender.com/transparencia`

