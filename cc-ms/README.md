
# Carpeta Ciudadana – Microservicios (estructura basada en plantilla)

Estructura clonada de la plantilla suministrada (`nodejs-server-server-generated`) y adaptada a 4 servicios:
- `micarpeta/` (Operador + dominio Notificaciones)
- `registraduria/`
- `mintic/`
- `notificador/`

## Ejecutar con Docker & Compose
```bash
docker compose build
docker compose up -d
# verificar:
docker ps
```

### Kong (API Management)
- Admin: http://localhost:8001
- Proxy: http://localhost:8000

### Servicios
- micarpeta:     http://localhost:3000/api/v1
- registraduria: http://localhost:3001/api/v1
- mintic:        http://localhost:3002/api/v1
- notificador:   http://localhost:3003/api/v1
