# Carpeta Ciudadana - Pruebas

## 🚀 Uso Rápido

### Ejecutar Sistema Completo
```bash
# Con Kong (recomendado)
PROXY=kong ./run-system.sh

# Acceso directo
./run-system.sh
```

## 📁 Archivos

- **`run-system.sh`** - Script principal que ejecuta todo el flujo con eventos paso a paso
- **`carpeta-ciudadana-postman-local.json`** - Colección de Postman para pruebas manuales
- **`flow-uml.txt`** - Diagramas UML para herramientas online (PlantUML/Mermaid)

## 🌐 URLs

- **Kong Admin**: http://localhost:8001
- **Kong Proxy**: http://localhost:8000
- **Servicios via Kong**: http://localhost:8000/{servicio}/api/v1
- **Servicios directos**: http://localhost:3000-3003/api/v1

## 📊 Diagramas

Compilar `flow-uml.txt` en:
- **PlantUML**: http://www.plantuml.com/plantuml/uml/
- **Mermaid**: https://mermaid.live/
