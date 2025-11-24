
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { Kafka } = require('kafkajs');
const axios = require('axios');
const { executeWithFallback, getStats } = require('./utils/errorHandler');

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3003;
const BASE = '/api/v1';

module.exports = { app, PORT, BASE };

// Kafka configuration
const kafka = new Kafka({
  clientId: 'notificador-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

// Consumer eliminado - Notificador ahora funciona solo via HTTP

// Initialize Kafka
async function initKafka() {
  try {
    console.log('Notificador iniciado - Sin suscripción a Kafka (nueva arquitectura)');
    console.log('El Notificador ahora recibe notificaciones via HTTP desde MiCarpeta');
  } catch (error) {
    console.error('Error inicializando Notificador:', error);
  }
}

// Función eliminada - Notificador ahora funciona solo via HTTP

// Notificar a MinTIC (simulado) con manejo de errores
async function notificarMinTIC(ciudadanoId, operadorId) {
  const data = { ciudadanoId, operadorId };
  
  return await executeWithFallback(
    'mintic',
    data,
    async () => {
      // Simular notificación a MinTIC ya que no es un microservicio
      console.log(`[SIM-MINTIC] Notificación simulada para ciudadano: ${ciudadanoId}, operador: ${operadorId}`);
      console.log(`[SIM-MINTIC] Datos enviados: { ciudadanoId: ${ciudadanoId}, operadorId: ${operadorId}, correo: ${ciudadanoId}@carpeta.gov.co }`);
      
      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Simular posibilidad de error (10% de probabilidad para testing)
      if (process.env.SIMULATE_ERRORS === 'true' && Math.random() < 0.1) {
        throw new Error('Error simulado en notificación a MinTIC');
      }
      
      console.log(`Notificación enviada a MinTIC para ciudadano: ${ciudadanoId}`);
      return { notificado: true, ciudadanoId, operadorId };
    },
    {
      enableIdempotency: true,
      enableMock: true,
      timeout: 5000
    }
  );
}

// Notificar al ciudadano con manejo de errores
async function notificarCiudadano(ciudadanoId, documentoId, url) {
  try {
    const email = `${ciudadanoId}@carpeta.gov.co`;
    const subject = 'Documento firmado y disponible';
    const body = `
      Estimado ciudadano,
      
      Su documento ha sido firmado exitosamente y está disponible en:
      ${url}
      
      Documento ID: ${documentoId}
      
      Gracias por usar nuestros servicios.
    `;
    
    await enviarEmail(email, subject, body);
    console.log(`Notificación enviada al ciudadano: ${ciudadanoId}`);
  } catch (error) {
    console.error('Error notificando al ciudadano:', error);
    // No lanzar error - el servicio debe continuar
  }
}

// Función para enviar email con manejo de errores y idempotencia
async function enviarEmail(to, subject, body, idempotencyKey = null) {
  const data = { to, subject, body };
  
  return await executeWithFallback(
    'email',
    data,
    async () => {
      console.log(`[EMAIL] Enviando a: ${to}`);
      console.log(`[EMAIL] Asunto: ${subject}`);
      console.log(`[EMAIL] Contenido: ${body}`);
      
      // Simular envío de email con posibilidad de error
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simular posibilidad de error (10% de probabilidad si está habilitado)
      if (process.env.SIMULATE_ERRORS === 'true' && Math.random() < 0.1) {
        throw new Error('Error simulado en envío de email');
      }
      
      // En producción, aquí iría la llamada real al servicio de email
      // Ejemplo: await emailService.send({ to, subject, body });
      
      return { enviado: true, to, subject };
    },
    {
      idempotencyKey,
      enableIdempotency: true,
      enableMock: true,
      timeout: 5000
    }
  );
}

// Endpoint para enviar email con idempotencia
app.post(`${BASE}/email`, async (req, res) => {
  const { to, subject, body, idempotencyKey } = req.body || {};
  
  // Validación básica
  if (!to || !subject) {
    return res.status(400).json({ 
      error: 'to y subject requeridos',
      enviado: false 
    });
  }
  
  try {
    // Ejecutar con manejo de errores y fallback a mock
    const result = await enviarEmail(to, subject, body, idempotencyKey);
    
    // Siempre responder 202 Accepted (idempotencia)
    // Incluso si falló internamente, el mock garantiza una respuesta
    res.status(202).json(result);
    
  } catch (error) {
    // Este caso no debería ocurrir si el mock está habilitado
    // Pero por seguridad, siempre respondemos exitosamente
    console.error('[Error crítico] Fallo en endpoint /email:', error);
    res.status(202).json({
      enviado: true,
      mock: true,
      to,
      subject,
      timestamp: new Date().toISOString(),
      mensaje: 'Email procesado en modo mock debido a error crítico'
    });
  }
});

// Endpoint para estadísticas del sistema
app.get(`${BASE}/stats`, (req, res) => {
  try {
    const stats = getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
});

// Health check endpoint
app.get(`${BASE}/health`, (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'notificador',
    timestamp: new Date().toISOString()
  });
});

// Inicializar Kafka y luego iniciar el servidor
initKafka().then(() => {
  app.listen(PORT, ()=> console.log('notificador on', PORT));
}).catch(error => {
  console.error('Error inicializando Kafka:', error);
  // Iniciar servidor aunque Kafka falle
  app.listen(PORT, ()=> console.log('notificador on', PORT, '(Kafka no disponible)'));
});
