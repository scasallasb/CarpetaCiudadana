
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
cmd="${1:-up}"

case "$cmd" in
  up)
    docker compose build
    docker compose up -d zookeeper kafka kong-database
    sleep 5
    docker compose up kong-migrations || true
    docker compose up -d kong micarpeta registraduria mintic notificador
    sleep 5
    ./scripts/kafka-setup.sh
    ./scripts/kong-setup.sh
    ;;
  down)
    docker compose down -v
    ;;
  logs)
    docker compose logs -f --tail=100
    ;;
  *)
    echo "Usage: $0 {up|down|logs}"
    ;;
esac
