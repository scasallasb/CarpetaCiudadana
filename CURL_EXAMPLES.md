# Ejemplos de CURL para Probar Endpoints

URL base: `https://carpetaciudadana-arq-int.fly.dev`

## 1. Health Check / Listar Ciudadanos (GET)

```bash
curl -X GET https://carpetaciudadana-arq-int.fly.dev/api/v1/ciudadano/listar
```

## 2. Crear Carpeta (POST)

```bash
curl -X POST https://carpetaciudadana-arq-int.fly.dev/api/v1/carpeta \
  -H "Content-Type: application/json" \
  -d '{
    "Ciudadano": {
      "nombre": "Juan Pérez",
      "correoCarpeta": "juan.perez@example.com",
      "tipoIdentificacion": "CC",
      "numeroIdentificacion": "1234567890"
    }
  }'
```

## 3. Obtener Carpeta por ID (GET)

```bash
curl -X GET https://carpetaciudadana-arq-int.fly.dev/api/v1/carpeta/f9e8d7c6-b5a4-3210-9876-543210fe4567
```

## 4. Obtener Carpeta por Ciudadano (GET)

```bash
curl -X GET https://carpetaciudadana-arq-int.fly.dev/api/v1/ciudadano/f9e8d7c6-b5a4-3210-9876-543210fe4567/carpeta
```

## 5. Crear Documento (POST)

```bash
curl -X POST https://carpetaciudadana-arq-int.fly.dev/api/v1/documento \
  -H "Content-Type: application/json" \
  -d '{
    "Documento": {
      "carpetaId": "f9e8d7c6-b5a4-3210-9876-543210fe4567",
      "tipo": "cedula_digital",
      "nombre": "Cédula de Identidad",
      "url": "https://repositorio-documentos.gov.co/documentos/doc-123.pdf"
    }
  }'
```

## 6. Obtener Documentos de una Carpeta (GET)

```bash
curl -X GET https://carpetaciudadana-arq-int.fly.dev/api/v1/carpeta/f9e8d7c6-b5a4-3210-9876-543210fe4567/documentos
```

## 7. Obtener Ciudadanos de un Operador (GET)

```bash
curl -X GET https://carpetaciudadana-arq-int.fly.dev/api/v1/operador/op-micarpeta-001/ciudadanos
```

## 8. Notificar a MinTIC (POST)

```bash
curl -X POST https://carpetaciudadana-arq-int.fly.dev/api/v1/notificaciones/minTIC \
  -H "Content-Type: application/json" \
  -d '{
    "Ciudadano": {
      "id": "f9e8d7c6-b5a4-3210-9876-543210fe4567",
      "operadorId": "op-micarpeta-001",
      "correoCarpeta": "juan.perez@example.com"
    }
  }'
```

## 9. Notificar Usuario (POST)

```bash
curl -X POST https://carpetaciudadana-arq-int.fly.dev/api/v1/notificaciones/usuario \
  -H "Content-Type: application/json" \
  -d '{
    "Notificacion": {
      "tipo": "email",
      "destinatario": "juan.perez@example.com",
      "mensaje": "Su carpeta ciudadana ha sido creada exitosamente"
    }
  }'
```

## Ejemplos con Formato Bonito (jq)

Si tienes `jq` instalado, puedes formatear las respuestas JSON:

```bash
curl -X GET https://carpetaciudadana-arq-int.fly.dev/api/v1/ciudadano/listar | jq
```

## Verificar Respuesta HTTP Completa

Para ver los headers y el código de estado:

```bash
curl -v -X GET https://carpetaciudadana-arq-int.fly.dev/api/v1/ciudadano/listar
```

## Probar con Timeout

```bash
curl --max-time 10 -X GET https://carpetaciudadana-arq-int.fly.dev/api/v1/ciudadano/listar
```

