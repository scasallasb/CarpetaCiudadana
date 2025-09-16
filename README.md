# Carpeta Ciudadana - Sistema de Microservicios

Sistema de microservicios para la gestión de carpetas ciudadanas con arquitectura basada en eventos usando Kafka y API Gateway con Kong.

## 🏗️ Arquitectura

### Componentes
- **Kong API Gateway** (Puerto 8000/8001) - Proxy y administración
- **MiCarpeta** (Puerto 3000) - Operador principal y gestión de carpetas
- **Registraduría** (Puerto 3001) - Verificación de identidad y firma de documentos
- **Notificador** (Puerto 3003) - Envío de notificaciones por email
- **Kafka** (Puerto 29092) - Mensajería asíncrona
- **PostgreSQL** (Puerto 5432) - Base de datos de Kong
- **Zookeeper** (Puerto 2181) - Coordinación de Kafka

### Flujo de Datos (Nueva Arquitectura)
```
Cliente → MiCarpeta (REST) → Kafka (FIRMAR_DOCUMENTO) → Registraduría → Kafka (DOCUMENTO_FIRMADO) → MiCarpeta → Notificador (HTTP)
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose instalados
- Puerto 3000-3001, 3003, 8000-8001, 29092, 5432, 2181 disponibles

### 1. Clonar y Navegar
```bash
cd "Taller 1 Desarrollo/cc-ms"
```

### 2. Iniciar Sistema
```bash
# Opción 1: Script automatizado (recomendado)
chmod +x scripts/dev.sh
./scripts/dev.sh up

# Opción 2: Manual
docker compose build
docker compose up -d
```

### 3. Configurar Kong
```bash
# Configurar servicios y rutas en Kong
./scripts/kong-setup.sh
```

### 4. Verificar Estado
```bash
docker ps
```

### 5. Probar Sistema
```bash
cd ../Postman
chmod +x run-system.sh
./run-system.sh
```

## 📋 Comandos Útiles

### Gestión del Sistema
```bash
# Iniciar sistema
./scripts/dev.sh up

# Detener sistema
./scripts/dev.sh down

# Ver logs
./scripts/dev.sh logs

# Reiniciar servicios específicos
docker compose restart micarpeta registraduria notificador
```

### Verificación de Servicios
```bash
# Estado de contenedores
docker ps

# Logs de servicios específicos
docker logs cc-ms-micarpeta-1 --tail 20
docker logs cc-ms-registraduria-1 --tail 20
docker logs cc-ms-notificador-1 --tail 20

# Verificar Kafka
docker exec cc-ms-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list
```

## 🧪 Pruebas

### Scripts de Prueba Disponibles
```bash
# Flujo completo con nueva arquitectura
./run-system.sh

# Usar Kong como proxy
PROXY=kong ./run-system.sh

# Acceso directo a servicios
./run-system.sh
```

## 🌐 URLs y Endpoints

### API Gateway (Kong)
- **Admin API**: http://localhost:8001
- **Proxy**: http://localhost:8000
- **Status**: http://localhost:8001/status
- **Services**: http://localhost:8001/services
- **Routes**: http://localhost:8001/routes

### Microservicios (Directo)
- **MiCarpeta**: http://localhost:3000/api/v1
- **Registraduría**: http://localhost:3001/api/v1
- **Notificador**: http://localhost:3003/api/v1

### Microservicios (Via Kong)
- **MiCarpeta**: http://localhost:8000/micarpeta/api/v1
- **Registraduría**: http://localhost:8000/registraduria/api/v1
- **Notificador**: http://localhost:8000/notificador/api/v1

## 📊 Flujo de Negocio (Nueva Arquitectura)

### 1. Verificación de Identidad
```bash
curl -X POST http://localhost:8000/registraduria/api/v1/identidad/verify \
  -H 'Content-Type: application/json' \
  -d '{"ciudadanoId":"f9e8d7c6-b5a4-3210-9876-543210fe4567","tipoIdentificacion":"CC","numeroIdentificacion":"1234567890"}'
```

### 2. Solicitud de Carpeta (Nuevo Endpoint)
```bash
curl -X POST http://localhost:8000/micarpeta/api/v1/carpeta \
  -H 'Content-Type: application/json' \
  -d '{
    "Ciudadano": {
      "nombre": "Juan Pérez",
      "correoCarpeta": "juan.perez@carpeta.gov.co",
      "tipoIdentificacion": "CC",
      "numeroIdentificacion": "1234567890"
    }
  }'
```

### 3. Verificar Carpeta Creada
```bash
curl -X GET http://localhost:8000/micarpeta/api/v1/carpeta/f9e8d7c6-b5a4-3210-9876-543210fe4567
```

## 🔄 Eventos Kafka (Nueva Arquitectura)

### Tópicos
- **FIRMAR_DOCUMENTO**: Solicitud de firma de documento (MiCarpeta → Registraduría)
- **DOCUMENTO_FIRMADO**: Documento firmado (Registraduría → MiCarpeta)

### Flujo de Eventos
1. **Cliente** → MiCarpeta: Solicitud de carpeta (REST)
2. **MiCarpeta** → Kafka: Evento `FIRMAR_DOCUMENTO` con `Solicitud` + `Notificacion` SMS
3. **Registraduría** ← Kafka: Recibe evento y procesa solicitud
4. **Registraduría** → Kafka: Evento `DOCUMENTO_FIRMADO` con `Solicitud` completada + `Notificacion` email
5. **MiCarpeta** ← Kafka: Recibe evento y crea carpeta
6. **MiCarpeta** → Notificador: Envía notificación HTTP al ciudadano

### Estructura de Eventos

#### Evento FIRMAR_DOCUMENTO
```json
{
  "Solicitud": {
    "id": "sol-789",
    "ciudadanoId": "f9e8d7c6-b5a4-3210-9876-543210fe4567",
    "documentosSolicitados": ["CC1234567890"],
    "estado": "pendiente"
  },
  "Notificacion": {
    "tipo": "sms",
    "destinatario": "+573001112233",
    "mensaje": "Se ha creado una nueva solicitud en la Registraduría General de la Nación para firmar su documento de identidad CC*******7890"
  }
}
```

#### Evento DOCUMENTO_FIRMADO
```json
{
  "Solicitud": {
    "id": "sol-789",
    "ciudadanoId": "f9e8d7c6-b5a4-3210-9876-543210fe4567",
    "documentosSolicitados": ["CC1234567890"],
    "estado": "Completada"
  },
  "Notificacion": {
    "tipo": "email",
    "correoCarpeta": "nuevos.ciudadanos@carpeta.gov.co",
    "mensaje": "La Registraduría General de la Nación a firmado el documento de identidad CC*******7890"
  }
}
```

## 📁 Estructura del Proyecto

```
cc-ms/
├── micarpeta/          # Operador principal (Consumer + Producer)
├── registraduria/      # Verificación de identidad (Consumer + Producer)
├── notificador/        # Notificaciones (Solo HTTP)
├── scripts/            # Scripts de automatización
└── docker-compose.yml  # Configuración de servicios

Postman/
├── carpeta-ciudadana-postman-local.json  # Colección de Postman
├── run-system.sh                         # Flujo completo con nueva arquitectura
├── flow-uml.txt                          # Diagramas UML actualizados
└── README.md                             # Documentación de Postman
```

## 🐛 Solución de Problemas

### Servicios No Inician
```bash
# Verificar logs
docker logs cc-ms-micarpeta-1
docker logs cc-ms-registraduria-1
docker logs cc-ms-notificador-1

# Reconstruir imágenes
docker compose build
docker compose up -d
```

### Kafka No Funciona
```bash
# Verificar estado de Kafka
docker logs cc-ms-kafka-1
docker logs cc-ms-zookeeper-1

# Reiniciar Kafka
docker compose restart kafka zookeeper
```

### Kong No Responde
```bash
# Verificar estado de Kong
curl http://localhost:8001/status

# Reconfigurar Kong
./scripts/kong-setup.sh
```

### Eventos Kafka No Se Procesan
```bash
# Verificar topics
docker exec cc-ms-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list

# Ver eventos en tiempo real
docker exec cc-ms-kafka-1 kafka-console-consumer --bootstrap-server localhost:9092 --topic FIRMAR_DOCUMENTO --from-beginning
docker exec cc-ms-kafka-1 kafka-console-consumer --bootstrap-server localhost:9092 --topic DOCUMENTO_FIRMADO --from-beginning
```

## 📈 Monitoreo

### Logs en Tiempo Real
```bash
# Todos los servicios
docker compose logs -f

# Servicio específico
docker logs -f cc-ms-micarpeta-1
```

### Métricas de Kafka
```bash
# Listar tópicos
docker exec cc-ms-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list

# Verificar consumidores
docker exec cc-ms-kafka-1 kafka-consumer-groups --bootstrap-server localhost:9092 --list

# Ver eventos específicos
docker exec cc-ms-kafka-1 kafka-console-consumer --bootstrap-server localhost:9092 --topic FIRMAR_DOCUMENTO --from-beginning --max-messages 5
```

## 🔧 Configuración

### Variables de Entorno
- `PORT`: Puerto del servicio (3000, 3001, 3003)
- `KAFKA_BROKER`: URL del broker de Kafka (kafka:9092)

### Personalización
Los servicios pueden ser personalizados modificando los archivos en cada directorio:
- `index.js`: Lógica principal del servicio
- `package.json`: Dependencias
- `Dockerfile`: Configuración del contenedor

## 📚 Documentación Adicional

- **Flujo Detallado**: Ver `Postman/run-system.sh`
- **Diagramas UML**: Ver `Postman/flow-uml.txt`
- **Colección Postman**: Importar `Postman/carpeta-ciudadana-postman-local.json`
- **Modelo Canónico**: Ver `modelo_canonico.json`

## ✅ Estado del Sistema

### Servicios Funcionando
- ✅ MiCarpeta (Operador + Consumer/Producer)
- ✅ Registraduría (Consumer/Producer)
- ✅ Notificador (Solo HTTP)
- ✅ Kong API Gateway
- ✅ Kafka
- ✅ PostgreSQL
- ✅ Zookeeper

### Funcionalidades Verificadas
- ✅ Solicitud de carpeta (Nuevo endpoint)
- ✅ Verificación de identidad
- ✅ Eventos Kafka asíncronos
- ✅ Procesamiento de solicitudes
- ✅ Creación automática de carpetas
- ✅ Notificaciones HTTP
- ✅ API Gateway
- ✅ Comunicación entre servicios

### Arquitectura de Eventos
- ✅ Topic `FIRMAR_DOCUMENTO` funcionando
- ✅ Topic `DOCUMENTO_FIRMADO` funcionando
- ✅ Flujo asíncrono completo
- ✅ Modelos de datos canónicos
- ✅ Notificaciones SMS y Email

---

**Desarrollado para el Taller 1 - Arquitectura de Integraciones**

**Última actualización**: Nueva arquitectura de eventos implementada con flujo asíncrono completo.