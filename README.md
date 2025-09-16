# Carpeta Ciudadana - Sistema de Microservicios

Sistema de microservicios para la gestión de carpetas ciudadanas con arquitectura basada en eventos usando Kafka y API Gateway con Kong.

## 🏗️ Arquitectura

### Componentes
- **Kong API Gateway** (Puerto 8000/8001) - Proxy y administración
- **MiCarpeta** (Puerto 3000) - Operador principal y gestión de carpetas
- **Registraduría** (Puerto 3001) - Verificación de identidad y firma de documentos
- **MinTIC** (Puerto 3002) - Registro de ciudadanos
- **Notificador** (Puerto 3003) - Envío de notificaciones por email
- **Kafka** (Puerto 29092) - Mensajería asíncrona
- **PostgreSQL** (Puerto 5432) - Base de datos de Kong
- **Zookeeper** (Puerto 2181) - Coordinación de Kafka

### Flujo de Datos
```
Cliente → Kong → Microservicios
                ↓
            Kafka Events
                ↓
        Procesamiento Asíncrono
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose instalados
- Puerto 3000-3003, 8000-8001, 29092, 5432, 2181 disponibles

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

### 3. Verificar Estado
```bash
docker ps
```

### 4. Probar Sistema
```bash
cd ../Postman
chmod +x run-flow-complete.sh
./run-flow-complete.sh
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
# Flujo completo con verificación
./run-flow-complete.sh

# Flujo original
./run-flow-ios.sh

# Diagnóstico de servicios
./run-flow-test.sh

# Flujo simplificado
./run-flow-working.sh
```

### Pruebas con Kong
```bash
# Usar Kong como proxy
PROXY=kong ./run-flow-complete.sh

# Acceso directo a servicios
./run-flow-complete.sh
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
- **MinTIC**: http://localhost:3002/api/v1
- **Notificador**: http://localhost:3003/api/v1

### Microservicios (Via Kong)
- **MiCarpeta**: http://localhost:8000/micarpeta/api/v1
- **Registraduría**: http://localhost:8000/registraduria/api/v1
- **MinTIC**: http://localhost:8000/mintic/api/v1
- **Notificador**: http://localhost:8000/notificador/api/v1

## 📊 Flujo de Negocio

### 1. Verificación de Identidad
```bash
curl -X POST http://localhost:8000/registraduria/api/v1/identidad/verify \
  -H 'Content-Type: application/json' \
  -d '{"ciudadanoId":"uuid-1234","tipoIdentificacion":"CC","numeroIdentificacion":"1234567890"}'
```

### 2. Creación de Carpeta
```bash
curl -X POST http://localhost:8000/micarpeta/api/v1/carpeta/carp-1234 \
  -H 'Content-Type: application/json' \
  -d '{"Carpeta":{"id":"carp-1234","ciudadanoId":"uuid-1234","operadorId":"op-001","estado":"activa"}}'
```

### 3. Registro de Documento
```bash
curl -X POST http://localhost:8000/micarpeta/api/v1/documento \
  -H 'Content-Type: application/json' \
  -d '{"Documento":{"id":"doc-123","tipo":"cedula_digital","carpetaId":"carp-1234"}}'
```

## 🔄 Eventos Kafka

### Tópicos
- **ciudadano-registrado**: Evento cuando se crea una carpeta
- **documento-firmado**: Evento cuando se firma un documento

### Flujo de Eventos
1. MiCarpeta envía evento `ciudadano-registrado`
2. Registraduría consume el evento y procesa
3. Registraduría envía evento `documento-firmado`
4. Notificador consume el evento y envía notificaciones

## 📁 Estructura del Proyecto

```
cc-ms/
├── micarpeta/          # Operador principal
├── registraduria/      # Verificación de identidad
├── mintic/            # Registro de ciudadanos
├── notificador/       # Notificaciones
├── scripts/           # Scripts de automatización
└── docker-compose.yml # Configuración de servicios

Postman/
├── carpeta-ciudadana-postman-local.json  # Colección de Postman
├── run-flow-complete.sh                  # Flujo completo
├── run-flow-test.sh                      # Diagnóstico
├── flow.txt                              # Documentación del flujo
├── flow-uml.txt                          # Diagramas UML
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

# Reiniciar Kong
docker compose restart kong kong-database
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
```

## 🔧 Configuración

### Variables de Entorno
- `PORT`: Puerto del servicio (3000-3003)
- `KAFKA_BROKER`: URL del broker de Kafka
- `MINTIC_URL`: URL del servicio MinTIC
- `NOTIFICADOR_URL`: URL del servicio Notificador

### Personalización
Los servicios pueden ser personalizados modificando los archivos en cada directorio:
- `index.js`: Lógica principal del servicio
- `package.json`: Dependencias
- `Dockerfile`: Configuración del contenedor

## 📚 Documentación Adicional

- **Flujo Detallado**: Ver `Postman/flow.txt`
- **Diagramas UML**: Ver `Postman/flow-uml.txt`
- **Colección Postman**: Importar `Postman/carpeta-ciudadana-postman-local.json`

## ✅ Estado del Sistema

### Servicios Funcionando
- ✅ MiCarpeta (Operador)
- ✅ Registraduría
- ✅ MinTIC
- ✅ Notificador
- ✅ Kong API Gateway
- ✅ Kafka
- ✅ PostgreSQL
- ✅ Zookeeper

### Funcionalidades Verificadas
- ✅ Creación de carpetas
- ✅ Verificación de identidad
- ✅ Registro de documentos
- ✅ Notificaciones
- ✅ Eventos Kafka
- ✅ API Gateway
- ✅ Comunicación entre servicios

---

**Desarrollado para el Taller 1 - Arquitectura de Integraciones**
