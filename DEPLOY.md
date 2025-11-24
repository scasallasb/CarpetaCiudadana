# Guía de Despliegue en Fly.io

## Prerrequisitos

1. Instalar Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/
2. Autenticarse: `fly auth login`
3. Tener una cuenta en fly.io

## Configuración Inicial

### 1. Configurar variables de entorno

Antes de desplegar, configura las variables de entorno necesarias:

```bash
# Configurar Kafka Broker (ajusta según tu configuración)
fly secrets set KAFKA_BROKER=tu-kafka-broker:9092

# Configurar URL del notificador (si está en otro servicio)
fly secrets set NOTIFICADOR_URL=http://tu-notificador:3003

# Configurar URL de MinTIC (opcional)
fly secrets set MINTIC_URL=http://tu-mintic:3002
```

### 2. Desplegar la aplicación

Desde el directorio `CarpetaCiudadana`:

```bash
# Primera vez: crear la app (si no existe)
fly launch

# O si ya existe la app, solo desplegar:
fly deploy
```

## Verificación

Después del despliegue, verifica que la aplicación esté funcionando:

```bash
# Ver logs
fly logs

# Ver estado
fly status

# Abrir en el navegador
fly open
```

## Troubleshooting

### Error: Dockerfile no encontrado
- Asegúrate de estar en el directorio `CarpetaCiudadana`
- Verifica que el Dockerfile existe: `ls -la Dockerfile`

### Error de conexión a Kafka
- Verifica que `KAFKA_BROKER` esté configurado correctamente
- Asegúrate de que el broker de Kafka sea accesible desde fly.io
- Considera usar un servicio de Kafka en la nube (Upstash, Confluent Cloud, etc.)

### Error en el build
- Verifica que `package-lock.json` existe en `cc-ms/micarpeta/`
- Si no existe, ejecuta `npm install` localmente para generarlo

## Notas Importantes

- El servicio se despliega en el puerto 3000 internamente
- Fly.io mapea automáticamente el puerto 80/443 externamente
- Los health checks están configurados en `/api/v1/ciudadano/listar`
- El servicio usa el nuevo manejo robusto de errores de Kafka implementado

