# Manejo de Errores y Idempotencia - Servicio Notificador

## Características Implementadas

### 1. **Idempotencia**
- Todas las operaciones son idempotentes
- Respuestas cacheadas por 24 horas
- Mismo request = misma respuesta (garantizado)
- Clave de idempotencia generada automáticamente o proporcionada por el cliente

### 2. **Fallback a Mock**
- Si el servicio falla, automáticamente usa respuesta mock
- El servicio **siempre responde exitosamente** (202 Accepted)
- No se interrumpe el flujo aunque haya errores internos

### 3. **Circuit Breaker**
- Protege contra fallos en cascada
- Estados: CLOSED, OPEN, HALF_OPEN
- Se abre después de 5 fallos consecutivos
- Se cierra automáticamente después de 1 minuto

### 4. **Timeouts**
- Operaciones con timeout de 5 segundos por defecto
- Si excede el timeout, usa respuesta mock automáticamente

## Uso

### Endpoint Principal: POST /api/v1/email

```json
POST /api/v1/email
Content-Type: application/json

{
  "to": "usuario@example.com",
  "subject": "Asunto del email",
  "body": "Contenido del email",
  "idempotencyKey": "opcional-id-unico" // Opcional
}
```

**Respuesta exitosa (siempre 202 Accepted):**
```json
{
  "enviado": true,
  "mock": false,  // false si fue procesado realmente, true si fue mock
  "to": "usuario@example.com",
  "subject": "Asunto del email",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Respuesta en modo mock (si falló el servicio):**
```json
{
  "enviado": true,
  "mock": true,
  "to": "usuario@example.com",
  "subject": "Asunto del email",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "mensaje": "Email procesado en modo mock debido a fallo del servicio"
}
```

### Idempotencia

Si envías el mismo request dos veces, recibirás la misma respuesta:

```bash
# Primera llamada
curl -X POST http://localhost:3003/api/v1/email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test"}'

# Segunda llamada (idéntica) - devuelve respuesta cacheada
curl -X POST http://localhost:3003/api/v1/email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test"}'
```

### Clave de Idempotencia Personalizada

Puedes proporcionar tu propia clave de idempotencia:

```json
{
  "to": "usuario@example.com",
  "subject": "Test",
  "body": "Contenido",
  "idempotencyKey": "mi-clave-unica-123"
}
```

## Endpoints Adicionales

### GET /api/v1/stats
Obtiene estadísticas del sistema (circuit breaker, cache, etc.)

```bash
curl http://localhost:3003/api/v1/stats
```

Respuesta:
```json
{
  "circuitBreaker": {
    "state": "CLOSED",
    "failureCount": 0,
    "lastFailureTime": null
  },
  "cache": {
    "size": 5,
    "maxSize": 1000
  }
}
```

### GET /api/v1/health
Health check del servicio

```bash
curl http://localhost:3003/api/v1/health
```

## Simulación de Errores (Testing)

Para probar el comportamiento con errores, puedes habilitar la simulación:

```bash
export SIMULATE_ERRORS=true
node index.js
```

Esto hará que el 10% de las operaciones fallen aleatoriamente, permitiendo probar:
- Fallback a mock
- Circuit breaker
- Idempotencia con errores

## Comportamiento Garantizado

1. **Siempre responde 202 Accepted** - Nunca falla el endpoint
2. **Idempotencia garantizada** - Mismo request = misma respuesta
3. **Fallback automático** - Si falla, usa mock y continúa
4. **No bloquea el flujo** - Errores internos no afectan al cliente

## Ejemplo de Flujo

```
Cliente → POST /email
    ↓
¿Existe respuesta cacheada?
    ↓ SÍ → Devolver respuesta cacheada (idempotencia)
    ↓ NO
¿Circuit breaker abierto?
    ↓ SÍ → Devolver mock
    ↓ NO
Intentar enviar email real
    ↓
¿Éxito?
    ↓ SÍ → Cachear respuesta y devolver
    ↓ NO → Devolver mock (y cachear)
```

## Notas de Implementación

- El cache es en memoria (Map). En producción, considera usar Redis
- El TTL del cache es de 24 horas
- El cache tiene un límite máximo de 1000 entradas
- El circuit breaker se resetea automáticamente después de 1 minuto

