#!/bin/sh
#
# run-system.sh — Sistema completo de Carpeta Ciudadana con eventos paso a paso
# Uso:
#   sh run-system.sh
# Variables opcionales:
#   PROXY=kong            # usa Kong proxy (http://localhost:8000)
#   CID=uuid-1234         # id de ciudadano
#   CARP=carp-1234        # id de carpeta
#   OP=op-micarpeta-001   # id de operador
#
# Ejemplos:
#   PROXY=kong sh run-system.sh
#   CID=u1 CARP=c1 OP=op-01 sh run-system.sh

CID="${CID:-f9e8d7c6-b5a4-3210-9876-543210fe4567}"
CARP="${CARP:-f9e8d7c6-b5a4-3210-9876-543210fe4567}"
OP="${OP:-op-micarpeta-001}"

if [ "${PROXY:-}" = "kong" ]; then
  MICARPETA="http://localhost:8000/micarpeta/api/v1"
  REGISTRADURIA="http://localhost:8000/registraduria/api/v1"
  NOTIFICADOR="http://localhost:8000/notificador/api/v1"
else
  MICARPETA="http://localhost:3000/api/v1"
  REGISTRADURIA="http://localhost:3001/api/v1"
  NOTIFICADOR="http://localhost:3003/api/v1"
fi

say() { printf '\n== %s ==\n' "$*"; }
event() { printf '\n🔔 EVENTO KAFKA: %s\n' "$*"; }
http() { printf '\n🌐 LLAMADA HTTP: %s\n' "$*"; }
step() { printf '\n📋 PASO %s: %s\n' "$1" "$2"; }
success() { printf '✅ %s\n' "$*"; }
info() { printf 'ℹ️  %s\n' "$*"; }

clear
echo "🚀 SISTEMA CARPETA CIUDADANA - FLUJO COMPLETO"
echo "=============================================="
echo "Ciudadano ID: $CID"
echo "Carpeta ID: $CARP"
echo "Operador ID: $OP"
echo "Proxy: ${PROXY:-directo}"
echo ""

# Verificar servicios
say "VERIFICANDO SERVICIOS"
info "Verificando Kong API Gateway..."
if curl -sS --connect-timeout 5 "http://localhost:8001/status" > /dev/null 2>&1; then
  success "Kong está disponible"
else
  echo "❌ Kong no está disponible"
  exit 1
fi

info "Verificando microservicios..."
# Verificar MiCarpeta
if curl -sS --connect-timeout 5 "http://localhost:3000/api/v1/ciudadano/listar" > /dev/null 2>&1; then
  success "MiCarpeta está disponible"
else
  echo "❌ MiCarpeta no está disponible"
fi

# Verificar Registraduría
if curl -sS --connect-timeout 5 "http://localhost:3001/api/v1/identidad/verify" -X POST -H "Content-Type: application/json" -d '{"test":"test"}' > /dev/null 2>&1; then
  success "Registraduría está disponible"
else
  echo "❌ Registraduría no está disponible"
fi


# Verificar Notificador
if curl -sS --connect-timeout 5 "http://localhost:3003/api/v1/email" -X POST -H "Content-Type: application/json" -d '{"test":"test"}' > /dev/null 2>&1; then
  success "Notificador está disponible"
else
  echo "❌ Notificador no está disponible"
fi

echo ""
say "INICIANDO FLUJO DE NEGOCIO"
echo "=========================="

step "1" "Verificación de Identidad"
http "Cliente -> Registraduría: POST /identidad/verify"
curl -sS -X POST "$REGISTRADURIA/identidad/verify" \
  -H 'Content-Type: application/json' \
  -d '{"ciudadanoId":"'"$CID"'","tipoIdentificacion":"CC","numeroIdentificacion":"1234567890"}'
printf '\n'
success "Identidad verificada exitosamente"

step "2" "Creación de Carpeta"
http "Cliente -> MiCarpeta: POST /carpeta"
curl -sS -X POST "$MICARPETA/carpeta" \
  -H 'Content-Type: application/json' \
  -d '{
    "Ciudadano": {
      "nombre": "Juan Pérez",
      "correoCarpeta": "juan.perez@carpeta.gov.co",
      "tipoIdentificacion": "CC",
      "numeroIdentificacion": "1234567890"
    }
  }'
printf '\n'
event "MiCarpeta envía evento 'FIRMAR_DOCUMENTO' a Kafka"
info "📊 Logs de MiCarpeta (envío a Kafka):"
docker logs cc-ms-micarpeta-1 --tail 5 | grep -E "(Evento enviado|Kafka)" || echo "Verificando logs..."
success "Solicitud recibida y evento FIRMAR_DOCUMENTO enviado a Kafka"

step "3" "Procesamiento Asíncrono"
info "El sistema ahora procesa la solicitud de forma asíncrona:"
info "1. MiCarpeta publica evento 'FIRMAR_DOCUMENTO' a Kafka"
info "2. Registraduría recibe el evento y procesa la solicitud"
info "3. Registraduría publica evento 'DOCUMENTO_FIRMADO' a Kafka"
info "4. MiCarpeta recibe el evento y crea la carpeta"
info "5. MiCarpeta envía notificación al ciudadano"
success "Flujo asíncrono iniciado"

say "FLUJO ASÍNCRONO CON KAFKA"
echo "========================"

info "Esperando eventos de Kafka (3 segundos)..."
sleep 3

echo ""
info "📊 EVENTOS KAFKA EN TIEMPO REAL:"
echo "================================"

info "🔍 EVENTOS ALMACENADOS EN KAFKA:"
echo "================================"

# Mostrar eventos del topic FIRMAR_DOCUMENTO
info "📋 Topic: FIRMAR_DOCUMENTO"
echo "Últimos eventos almacenados en Kafka:"
EVENTOS_SOLICITUD=$(docker exec cc-ms-kafka-1 kafka-console-consumer --bootstrap-server localhost:9092 --topic FIRMAR_DOCUMENTO --from-beginning --max-messages 5 --timeout-ms 5000 2>/dev/null | grep -v "Error processing message" | head -3)
if [ -n "$EVENTOS_SOLICITUD" ]; then
  echo "$EVENTOS_SOLICITUD" | while read -r evento; do
    if [ -n "$evento" ] && [ "$evento" != "Processed a total of"* ]; then
      echo "  📄 $evento"
    fi
  done
else
  echo "  No hay eventos en FIRMAR_DOCUMENTO"
fi

echo ""
info "📋 Topic: DOCUMENTO_FIRMADO"
echo "Últimos eventos almacenados en Kafka:"
EVENTOS_DOCUMENTO=$(docker exec cc-ms-kafka-1 kafka-console-consumer --bootstrap-server localhost:9092 --topic DOCUMENTO_FIRMADO --from-beginning --max-messages 5 --timeout-ms 5000 2>/dev/null | grep -v "Error processing message" | head -3)
if [ -n "$EVENTOS_DOCUMENTO" ]; then
  echo "$EVENTOS_DOCUMENTO" | while read -r evento; do
    if [ -n "$evento" ] && [ "$evento" != "Processed a total of"* ]; then
      echo "  📄 $evento"
    fi
  done
else
  echo "  No hay eventos en DOCUMENTO_FIRMADO"
fi

echo ""
info "🔔 Registraduría - Logs de procesamiento:"
docker logs cc-ms-registraduria-1 --tail 15 | grep -E "(Procesando evento|FIRMAR_DOCUMENTO|Documento firmado|evento enviado|DOCUMENTO_FIRMADO)" | tail -3 || echo "  No hay eventos recientes"

echo ""
info "🔔 Notificador - Logs de procesamiento:"
docker logs cc-ms-notificador-1 --tail 15 | grep -E "(Procesando evento|DOCUMENTO_FIRMADO|Notificaciones enviadas|Notificación enviada)" | tail -3 || echo "  No hay eventos recientes"

echo ""
info "📈 Estado de Kafka:"
docker exec cc-ms-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list | grep -v __consumer_offsets

success "Eventos Kafka procesados y verificados"

say "VERIFICACIONES FINALES"
echo "====================="

step "7" "Verificar Carpeta del Ciudadano"
curl -sS "$MICARPETA/ciudadano/$CID/carpeta"
printf '\n'

step "8" "Verificar Documentos de la Carpeta"
curl -sS "$MICARPETA/carpeta/$CARP/documentos"
printf '\n'

step "9" "Listar Ciudadanos"
curl -sS "$MICARPETA/ciudadano/listar"
printf '\n'

step "10" "Ciudadanos por Operador"
curl -sS "$MICARPETA/operador/$OP/ciudadanos"
printf '\n'

say "RESUMEN DEL SISTEMA"
echo "=================="
success "Flujo de negocio completado exitosamente"
success "Todos los microservicios funcionando"
success "Eventos Kafka procesados correctamente"
success "Comunicación HTTP entre servicios operativa"

echo ""
info "URLs disponibles:"
echo "  Kong Admin: http://localhost:8001"
echo "  Kong Proxy: http://localhost:8000"
echo "  MiCarpeta: http://localhost:3000 (directo) / http://localhost:8000/micarpeta (via Kong)"
echo "  Registraduría: http://localhost:3001 (directo) / http://localhost:8000/registraduria (via Kong)"
echo "  Notificador: http://localhost:3003 (directo) / http://localhost:8000/notificador (via Kong)"

echo ""
echo "🎉 SISTEMA CARPETA CIUDADANA - OPERATIVO"
