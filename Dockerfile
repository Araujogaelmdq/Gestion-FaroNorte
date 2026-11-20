# ==============================================================
# Dockerfile multi-stage para Club Social y Deportivo Faro Norte
# Node 22 LTS (Linux)
# ==============================================================

# --- Etapa 1: Compilación ---
FROM node:22-bullseye-slim AS builder
WORKDIR /app

# Instalar dependencias de compilación para paquetes nativos si fueran necesarios
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copiar manifiestos
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/
COPY apps/web/package*.json ./apps/web/

# Instalar todas las dependencias
RUN npm install

# Copiar el código fuente completo
COPY . .

# Compilar todos los paquetes en orden (shared -> api -> web)
RUN npm run build

# --- Etapa 2: Imagen final de producción ---
FROM node:22-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

# Copiar archivos necesarios para ejecutar
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/documents ./documents

# Directorio de datos para persistencia de SQLite si se usa volumen
RUN mkdir -p /app/data
ENV DATABASE_URL=/app/data/faronorte.db

EXPOSE 3001

CMD ["npm", "run", "start"]

