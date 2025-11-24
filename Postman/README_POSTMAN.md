# Guía de Uso de Colecciones Postman

## Archivos Disponibles

### Colecciones
- **`carpeta-ciudadana-postman-local.json`** - Colección principal (configurada para Fly.io por defecto)
- **`carpeta-ciudadana-postman-flyio.json`** - Copia de la colección para Fly.io

### Entornos (Environments)
- **`Local.postman_environment.json`** - Variables para entorno local
- **`Fly.io.postman_environment.json`** - Variables para entorno de producción (Fly.io)

## Cómo Usar

### Opción 1: Usar Entornos de Postman (Recomendado)

1. **Importar la colección:**
   - Abre Postman
   - Click en "Import"
   - Selecciona `carpeta-ciudadana-postman-local.json`

2. **Importar los entornos:**
   - Click en "Import"
   - Selecciona `Local.postman_environment.json` y `Fly.io.postman_environment.json`

3. **Cambiar entre entornos:**
   - En la esquina superior derecha de Postman, selecciona el entorno deseado:
     - **Local (Kong)** - Para probar en local
     - **Fly.io (Producción)** - Para probar en producción

### Opción 2: Modificar Variables de la Colección

1. Abre la colección en Postman
2. Click en "Variables" (pestaña en la colección)
3. Modifica `base_url` según necesites:
   - **Local (Kong):** `http://localhost:8000/micarpeta/api/v1`
   - **Local (Directo):** `http://localhost:3000/api/v1`
   - **Fly.io:** `https://carpetaciudadana-arq-int.fly.dev/api/v1`

## Endpoints Disponibles en Fly.io

Los siguientes endpoints están disponibles en producción:

- ✅ `GET /api/v1/ciudadano/listar` - Listar ciudadanos
- ✅ `POST /api/v1/carpeta` - Crear carpeta
- ✅ `GET /api/v1/carpeta/:id` - Obtener carpeta por ID
- ✅ `GET /api/v1/ciudadano/:id/carpeta` - Obtener carpeta por ciudadano
- ✅ `POST /api/v1/documento` - Crear documento
- ✅ `GET /api/v1/carpeta/:id/documentos` - Listar documentos
- ✅ `GET /api/v1/operador/:id/ciudadanos` - Listar ciudadanos por operador
- ✅ `POST /api/v1/notificaciones/minTIC` - Notificar a MinTIC
- ✅ `POST /api/v1/notificaciones/usuario` - Notificar usuario

## Endpoints Solo en Local

Los siguientes servicios solo están disponibles en local:

- ❌ Registraduría (puerto 3001)
- ❌ Notificador (puerto 3003)
- ❌ MinTIC (puerto 3002)
- ❌ Kong Admin (puerto 8001)

## Ejemplo de Uso

### Probar en Local
1. Selecciona el entorno "Local (Kong)"
2. Ejecuta cualquier request de la colección
3. Las URLs apuntarán a `http://localhost:8000/micarpeta/api/v1`

### Probar en Fly.io
1. Selecciona el entorno "Fly.io (Producción)"
2. Ejecuta cualquier request de la colección
3. Las URLs apuntarán a `https://carpetaciudadana-arq-int.fly.dev/api/v1`

## Notas

- La colección principal está configurada por defecto para Fly.io
- Puedes cambiar fácilmente entre entornos usando el selector de entornos en Postman
- Los servicios que dependen de otros microservicios (como Registraduría) solo funcionarán en local hasta que se desplieguen en producción

