
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { Kafka } = require('kafkajs');
const axios = require('axios');

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

// Notificar a MinTIC (simulado)
async function notificarMinTIC(ciudadanoId, operadorId) {
  try {
    // Simular notificación a MinTIC ya que no es un microservicio
    console.log(`[SIM-MINTIC] Notificación simulada para ciudadano: ${ciudadanoId}, operador: ${operadorId}`);
    console.log(`[SIM-MINTIC] Datos enviados: { ciudadanoId: ${ciudadanoId}, operadorId: ${operadorId}, correo: ${ciudadanoId}@carpeta.gov.co }`);
    
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log(`Notificación enviada a MinTIC para ciudadano: ${ciudadanoId}`);
  } catch (error) {
    console.error('Error notificando a MinTIC:', error);
  }
}

// Notificar al ciudadano
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
  }
}

// Función para enviar email (simulada)
async function enviarEmail(to, subject, body) {
  console.log(`[EMAIL] Enviando a: ${to}`);
  console.log(`[EMAIL] Asunto: ${subject}`);
  console.log(`[EMAIL] Contenido: ${body}`);
  
  // Simular envío de email
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { enviado: true, to, subject };
}

app.post(`${BASE}/email`, (req,res)=>{
  const { to, subject, body } = req.body || {};
  if(!to || !subject) return res.status(400).json({error:'to y subject requeridos'});
  console.log(`[EMAIL] to=${to} subject="${subject}" body="${body || ''}"`);
  res.status(202).json({ enviado: true });
});

// Inicializar Kafka y luego iniciar el servidor
initKafka().then(() => {
  app.listen(PORT, ()=> console.log('notificador on', PORT));
}).catch(error => {
  console.error('Error inicializando Kafka:', error);
  // Iniciar servidor aunque Kafka falle
  app.listen(PORT, ()=> console.log('notificador on', PORT, '(Kafka no disponible)'));
});
