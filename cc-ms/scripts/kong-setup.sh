
#!/usr/bin/env bash
set -euo pipefail
ADMIN="http://localhost:8001"

echo "Creating services in Kong..."
curl -sS -X POST "${ADMIN}/services" -d name=micarpeta    -d url=http://micarpeta:3000  >/dev/null || true
curl -sS -X POST "${ADMIN}/services" -d name=registraduria -d url=http://registraduria:3001  >/dev/null || true
curl -sS -X POST "${ADMIN}/services" -d name=notificador  -d url=http://notificador:3003  >/dev/null || true

echo "Creating routes in Kong..."
curl -sS -X POST "${ADMIN}/services/micarpeta/routes"    -d 'paths[]=/micarpeta'    -d strip_path=true -d 'methods[]=GET' -d 'methods[]=POST'  >/dev/null || true
curl -sS -X POST "${ADMIN}/services/registraduria/routes" -d 'paths[]=/registraduria' -d strip_path=true -d 'methods[]=GET' -d 'methods[]=POST'  >/dev/null || true
curl -sS -X POST "${ADMIN}/services/notificador/routes"  -d 'paths[]=/notificador'  -d strip_path=true -d 'methods[]=GET' -d 'methods[]=POST'  >/dev/null || true

echo "Done. Try:"
echo "  curl http://localhost:8000/micarpeta/api/v1/carpeta/carp-1234"
