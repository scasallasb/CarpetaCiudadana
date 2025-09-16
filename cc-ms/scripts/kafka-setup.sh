#!/usr/bin/env bash
set -euo pipefail

echo "Waiting for Kafka to be ready..."
sleep 10

echo "Creating Kafka topics..."

# Tópico 1: Para eventos de registro de ciudadano (MiCarpeta -> Registraduría)
docker exec cc-ms-kafka-1 kafka-topics --create \
  --topic ciudadano-registrado \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1 \
  --if-not-exists

# Tópico 2: Para eventos de documento firmado (Registraduría -> Notificaciones)
docker exec cc-ms-kafka-1 kafka-topics --create \
  --topic documento-firmado \
  --bootstrap-server localhost:9092 \
  --partitions 1 \
  --replication-factor 1 \
  --if-not-exists

echo "Kafka topics created successfully!"
echo "Topics:"
docker exec cc-ms-kafka-1 kafka-topics --list --bootstrap-server localhost:9092
