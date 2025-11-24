# Dockerfile para desplegar micarpeta en fly.io
FROM node:18-alpine

# Instalar dependencias del sistema si son necesarias
RUN apk add --no-cache \
    dumb-init

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json e instalar dependencias
COPY cc-ms/micarpeta/package.json cc-ms/micarpeta/package-lock.json* ./
# Usar npm ci si existe package-lock.json, sino npm install
RUN if [ -f package-lock.json ]; then \
      npm ci --only=production; \
    else \
      npm install --only=production; \
    fi && \
    npm cache clean --force

# Copiar el código de la aplicación
COPY cc-ms/micarpeta/ ./

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Exponer el puerto
EXPOSE 3000

# Usar dumb-init para manejar señales correctamente
ENTRYPOINT ["dumb-init", "--"]

# Iniciar la aplicación
CMD ["node", "index.js"]

