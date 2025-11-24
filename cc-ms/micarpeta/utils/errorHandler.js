/**
 * Manejador de errores con fallback a mock e idempotencia
 */

const crypto = require('crypto');

// Cache para respuestas idempotentes (en producción usar Redis)
const idempotencyCache = new Map();
const MAX_CACHE_SIZE = 1000;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

// Circuit breaker state
let circuitBreakerState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
let failureCount = 0;
const FAILURE_THRESHOLD = 5;
const RESET_TIMEOUT = 60000; // 1 minuto
let lastFailureTime = null;

/**
 * Genera un ID idempotente basado en el contenido de la request
 */
function generateIdempotencyKey(data) {
  const str = JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Verifica si existe una respuesta cacheada (idempotencia)
 */
function getCachedResponse(idempotencyKey) {
  const cached = idempotencyCache.get(idempotencyKey);
  if (!cached) return null;
  
  // Verificar TTL
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    idempotencyCache.delete(idempotencyKey);
    return null;
  }
  
  return cached.response;
}

/**
 * Guarda una respuesta en cache para idempotencia
 */
function cacheResponse(idempotencyKey, response) {
  // Limpiar cache si está muy lleno
  if (idempotencyCache.size >= MAX_CACHE_SIZE) {
    const firstKey = idempotencyCache.keys().next().value;
    idempotencyCache.delete(firstKey);
  }
  
  idempotencyCache.set(idempotencyKey, {
    response,
    timestamp: Date.now()
  });
}

/**
 * Verifica el estado del circuit breaker
 */
function checkCircuitBreaker() {
  if (circuitBreakerState === 'OPEN') {
    const timeSinceLastFailure = Date.now() - lastFailureTime;
    if (timeSinceLastFailure > RESET_TIMEOUT) {
      circuitBreakerState = 'HALF_OPEN';
      failureCount = 0;
      console.log('[Circuit Breaker] Cambiando a HALF_OPEN - intentando reconexión');
      return true;
    }
    return false; // Circuit breaker abierto
  }
  return true; // Circuit breaker cerrado o half-open
}

/**
 * Registra un fallo en el circuit breaker
 */
function recordFailure() {
  failureCount++;
  lastFailureTime = Date.now();
  
  if (failureCount >= FAILURE_THRESHOLD && circuitBreakerState !== 'OPEN') {
    circuitBreakerState = 'OPEN';
    console.error('[Circuit Breaker] Abierto - demasiados fallos consecutivos');
  }
}

/**
 * Registra un éxito en el circuit breaker
 */
function recordSuccess() {
  if (circuitBreakerState === 'HALF_OPEN') {
    circuitBreakerState = 'CLOSED';
    failureCount = 0;
    console.log('[Circuit Breaker] Cerrado - servicio recuperado');
  } else if (circuitBreakerState === 'CLOSED') {
    failureCount = Math.max(0, failureCount - 1);
  }
}

/**
 * Genera una respuesta mock estándar
 */
function generateMockResponse(operation, data) {
  const timestamp = new Date().toISOString();
  
  switch (operation) {
    case 'email':
      return {
        enviado: true,
        mock: true,
        to: data.to,
        subject: data.subject,
        timestamp,
        mensaje: 'Email procesado en modo mock debido a fallo del servicio'
      };
    
    case 'mintic':
      return {
        notificado: true,
        mock: true,
        ciudadanoId: data.ciudadanoId,
        operadorId: data.operadorId,
        timestamp,
        mensaje: 'Notificación a MinTIC procesada en modo mock debido a fallo del servicio'
      };
    
    default:
      return {
        procesado: true,
        mock: true,
        timestamp,
        mensaje: 'Operación procesada en modo mock debido a fallo del servicio'
      };
  }
}

/**
 * Ejecuta una operación con manejo de errores, idempotencia y fallback a mock
 */
async function executeWithFallback(operation, data, operationFn, options = {}) {
  const {
    idempotencyKey: providedKey = null,
    enableIdempotency = true,
    enableMock = true,
    timeout = 5000
  } = options;
  
  // Generar clave de idempotencia
  const idempotencyKey = providedKey || generateIdempotencyKey({ operation, data });
  
  // Verificar cache (idempotencia)
  if (enableIdempotency) {
    const cached = getCachedResponse(idempotencyKey);
    if (cached) {
      console.log(`[Idempotencia] Respuesta cacheada encontrada para operación: ${operation}`);
      return cached;
    }
  }
  
  // Verificar circuit breaker
  if (!checkCircuitBreaker()) {
    console.warn(`[Circuit Breaker] Abierto - usando mock para operación: ${operation}`);
    const mockResponse = generateMockResponse(operation, data);
    if (enableIdempotency) {
      cacheResponse(idempotencyKey, mockResponse);
    }
    return mockResponse;
  }
  
  // Intentar ejecutar la operación real
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), timeout)
    );
    
    const result = await Promise.race([
      operationFn(),
      timeoutPromise
    ]);
    
    // Éxito - actualizar circuit breaker y cachear respuesta
    recordSuccess();
    
    const response = {
      ...result,
      mock: false,
      timestamp: new Date().toISOString()
    };
    
    if (enableIdempotency) {
      cacheResponse(idempotencyKey, response);
    }
    
    return response;
    
  } catch (error) {
    // Error - registrar fallo
    recordFailure();
    
    console.error(`[Error] Fallo en operación ${operation}:`, error.message);
    
    // Si el mock está habilitado, devolver respuesta mock
    if (enableMock) {
      console.warn(`[Mock] Usando respuesta mock para operación: ${operation}`);
      const mockResponse = generateMockResponse(operation, data);
      
      if (enableIdempotency) {
        cacheResponse(idempotencyKey, mockResponse);
      }
      
      return mockResponse;
    }
    
    // Si el mock no está habilitado, lanzar el error
    throw error;
  }
}

/**
 * Limpia el cache de idempotencia (útil para testing)
 */
function clearIdempotencyCache() {
  idempotencyCache.clear();
  console.log('[Cache] Cache de idempotencia limpiado');
}

/**
 * Obtiene estadísticas del sistema
 */
function getStats() {
  return {
    circuitBreaker: {
      state: circuitBreakerState,
      failureCount,
      lastFailureTime
    },
    cache: {
      size: idempotencyCache.size,
      maxSize: MAX_CACHE_SIZE
    }
  };
}

module.exports = {
  executeWithFallback,
  generateIdempotencyKey,
  generateMockResponse,
  clearIdempotencyCache,
  getStats,
  checkCircuitBreaker,
  recordFailure,
  recordSuccess
};

