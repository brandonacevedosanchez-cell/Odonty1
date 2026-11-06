# ---------- Etapa 1: compilar la aplicación con Vite ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL se incrusta en el bundle durante la compilación.
ARG VITE_API_URL=https://odontyoriginal-1.onrender.com
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Etapa 2: servir los archivos estáticos con Nginx ----------
FROM nginx:1.27-alpine AS runtime

# La imagen oficial de Nginx sustituye ${PORT} al arrancar (plantillas en /etc/nginx/templates).
# Por defecto 80; plataformas como Render inyectan su propio PORT.
ENV PORT=80
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
