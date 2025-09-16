
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { Kafka } = require('kafkajs');

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3000;
const BASE = '/api/v1';

module.exports = { app, PORT, BASE };

const axios = require('axios');

// Kafka configuration
const kafka = new Kafka({
  clientId: 'micarpeta-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'micarpeta-group' });

// Initialize Kafka producer and consumer
async function initKafka() {
  try {
    await producer.connect();
    await consumer.connect();
    console.log('Kafka producer and consumer connected');
    
    // Suscribirse al tópico de documentos firmados
    await consumer.subscribe({ topic: 'DOCUMENTO_FIRMADO', fromBeginning: false });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          console.log(`Procesando evento: ${topic}`, data);
          
          if (topic === 'DOCUMENTO_FIRMADO') {
            await procesarDocumentoFirmado(data);
          }
        } catch (error) {
          console.error('Error procesando mensaje de Kafka:', error);
        }
      },
    });
  } catch (error) {
    console.error('Error connecting to Kafka:', error);
  }
}

// Procesar documento firmado
async function procesarDocumentoFirmado(data) {
  const { Solicitud, Notificacion } = data;
  
  if (!Solicitud || !Notificacion) {
    console.error('Error: Solicitud y Notificacion requeridos en el evento');
    return;
  }
  
  const ciudadanoId = Solicitud.ciudadanoId;
  console.log(`Procesando documento firmado para ciudadano: ${ciudadanoId}`);
  
  // Crear carpeta con documento firmado
  const carpetaId = ciudadanoId; // Usar el mismo ID
  const operadorId = 'op-micarpeta-001';
  
  const carpeta = { 
    id: carpetaId, 
    ciudadanoId: ciudadanoId,
    operadorId: operadorId, 
    estado: 'activa', 
    fechaCreacion: new Date().toISOString().slice(0,10) 
  };
  
  carpetas.set(carpetaId, carpeta);
  if (carpeta.ciudadanoId) ciudadanoToCarpeta.set(carpeta.ciudadanoId, carpetaId);
  if (carpeta.operadorId && carpeta.ciudadanoId) ensureSet(operadorToCiudadanos, carpeta.operadorId).add(carpeta.ciudadanoId);
  
  console.log(`Carpeta creada con documento firmado: ${carpetaId} para ciudadano: ${ciudadanoId}`);
  
  // Enviar notificación al ciudadano
  try {
    await axios.post('http://notificador:3003/api/v1/email', {
      to: Notificacion.correoCarpeta,
      subject: 'Documento firmado y disponible',
      body: Notificacion.mensaje
    });
    console.log(`Notificación enviada al ciudadano: ${ciudadanoId}`);
  } catch (error) {
    console.error('Error enviando notificación:', error);
  }
}

// in-memory stores
const carpetas = new Map();
const documentos = new Map();
const ciudadanoToCarpeta = new Map();
const operadorToCiudadanos = new Map();

function ensureArr(map, k){ if(!map.has(k)) map.set(k, []); return map.get(k); }
function ensureSet(map, k){ if(!map.has(k)) map.set(k, new Set()); return map.get(k); }

// POST /carpeta (sin ID en URL)
app.post(`${BASE}/carpeta`, async (req, res) => {
  const ciudadano = req.body?.Ciudadano || {};
  
  // Generar ID único para la carpeta
  const carpetaId = 'f9e8d7c6-b5a4-3210-9876-543210fe4567';
  const operadorId = 'op-micarpeta-001';
  
  console.log(`Solicitud de carpeta recibida para ciudadano: ${ciudadano.nombre}`);
  
  // Enviar evento a Kafka para solicitar firma de documento
  try {
    await producer.send({
      topic: 'FIRMAR_DOCUMENTO',
      messages: [{
        key: carpetaId,
        value: JSON.stringify({
          Solicitud: {
            id: "sol-789",
            ciudadanoId: carpetaId,
            documentosSolicitados: ["CC1234567890"],
            estado: "pendiente"
          },
          Notificacion: {
            tipo: "sms",
            destinatario: "+573001112233",
            mensaje: "Se ha creado una nueva solicitud en la Registraduría General de la Nación para firmar su documento de identidad CC*******7890"
          },
          timestamp: new Date().toISOString()
        })
      }]
    });
    console.log(`Evento enviado a Kafka: FIRMAR_DOCUMENTO para ${carpetaId}`);
  } catch (error) {
    console.error('Error enviando evento a Kafka:', error);
  }
  
  // Devolver respuesta con el nuevo modelo
  res.status(201).json({ 
    Respuesta: {
      id: carpetaId,
      mensaje: "Tu solicitud está siendo procesada, pronto recibirás un correo para acceder a tu carpeta ciudadana"
    }
  });
});

app.get(`${BASE}/carpeta/:id`, (req,res)=>{
  const c = carpetas.get(req.params.id);
  if(!c) return res.status(404).json({error:'carpeta no encontrada'});
  res.json({Carpeta:c});
});

app.get(`${BASE}/ciudadano/:id/carpeta`, (req,res)=>{
  const carpetaId = ciudadanoToCarpeta.get(req.params.id);
  if(!carpetaId) return res.status(404).json({error:'carpeta no encontrada'});
  res.json({Carpeta: carpetas.get(carpetaId)});
});

app.post(`${BASE}/documento`, (req,res)=>{
  const doc = req.body?.Documento;
  if(!doc?.carpetaId) return res.status(400).json({error:'Documento con carpetaId requerido'});
  
  // Generar URL prefijada para el documento si no existe
  const docId = doc.id || `doc-${Date.now()}`;
  const documentWithUrl = {
    ...doc,
    id: docId,
    url: doc.url || `https://repositorio-documentos.gov.co/documentos/${docId}.pdf`
  };
  
  ensureArr(documentos, doc.carpetaId).push(documentWithUrl);
  res.status(201).json({Documento: documentWithUrl});
});

app.get(`${BASE}/carpeta/:id/documentos`, (req,res)=>{
  res.json({Documentos: documentos.get(req.params.id) || []});
});

app.get(`${BASE}/operador/:id/ciudadanos`, (req,res)=>{
  const set = operadorToCiudadanos.get(req.params.id) || new Set();
  res.json({Ciudadanos: Array.from(set)});
});

app.get(`${BASE}/ciudadano/listar`, (_req,res)=>{
  res.json({Ciudadanos: Array.from(ciudadanoToCarpeta.keys())});
});

// --- Notificaciones (expuestas por el Operador) ---
app.post(`${BASE}/notificaciones/minTIC`, async (req,res)=>{
  const ciudadano = req.body?.Ciudadano;
  if(!ciudadano?.id || !ciudadano?.operadorId) return res.status(400).json({error:'Ciudadano.id y operadorId requeridos'});
  try{
    const minticUrl = process.env.MINTIC_URL || 'http://mintic:3002';
    await axios.post(`${minticUrl}/api/v1/ciudadanos`, { ciudadanoId: ciudadano.id, operadorId: ciudadano.operadorId, correo: ciudadano.correoCarpeta||''});
    ensureSet(operadorToCiudadanos, ciudadano.operadorId).add(ciudadano.id);
    res.status(202).json({status:'enviado-a-mintic'});
  }catch(e){
    res.status(502).json({error:'fallo notificando a MinTIC', detail: e.message});
  }
});

app.post(`${BASE}/notificaciones/usuario`, async (req,res)=>{
  const noti = req.body?.Notificacion;
  if(!noti?.tipo || !noti?.destinatario) return res.status(400).json({error:'Notificacion.tipo y destinatario requeridos'});
  try{
    const notifUrl = process.env.NOTIFICADOR_URL || 'http://notificador:3003';
    await axios.post(`${notifUrl}/api/v1/email`, { to: noti.destinatario, subject: 'Carpeta creada', body: noti.mensaje || 'Su carpeta está activa.'});
    res.status(202).json({status:'notificado-usuario'});
  }catch(e){
    res.status(502).json({error:'fallo notificando al usuario', detail:e.message});
  }
});

// Inicializar Kafka y luego iniciar el servidor
initKafka().then(() => {
  app.listen(PORT, ()=> console.log('micarpeta on', PORT));
}).catch(error => {
  console.error('Error inicializando Kafka:', error);
  // Iniciar servidor aunque Kafka falle
  app.listen(PORT, ()=> console.log('micarpeta on', PORT, '(Kafka no disponible)'));
});
