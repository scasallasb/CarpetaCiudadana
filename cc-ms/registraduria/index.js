
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { Kafka } = require('kafkajs');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

const PORT = process.env.PORT || 3001;
const BASE = '/api/v1';

module.exports = { app, PORT, BASE };

// Kafka configuration
const kafka = new Kafka({
  clientId: 'registraduria-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'registraduria-group' });
const producer = kafka.producer();

// Initialize Kafka
async function initKafka() {
  try {
    await consumer.connect();
    await producer.connect();
    console.log('Kafka consumer and producer connected');
    
    // Suscribirse al tópico de solicitudes de firma
    await consumer.subscribe({ topic: 'FIRMAR_DOCUMENTO', fromBeginning: false });
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const data = JSON.parse(message.value.toString());
          console.log(`Procesando evento: ${topic}`, data);
          
          if (topic === 'FIRMAR_DOCUMENTO') {
            await procesarSolicitudFirma(data);
          }
        } catch (error) {
          console.error('Error procesando mensaje de Kafka:', error);
        }
      },
    });
  } catch (error) {
    console.error('Error inicializando Kafka:', error);
  }
}

// Procesar solicitud de firma de documento
async function procesarSolicitudFirma(data) {
  // Extraer datos del evento
  const { Solicitud, Notificacion } = data;
  
  if (!Solicitud || !Notificacion) {
    console.error('Error: Solicitud y Notificacion requeridos en el evento');
    return;
  }
  
  const ciudadanoId = Solicitud.ciudadanoId;
  const solicitudId = Solicitud.id;
  
  console.log(`Procesando solicitud de firma: ${solicitudId} para ciudadano: ${ciudadanoId}`);
  console.log(`Notificación SMS enviada a: ${Notificacion.destinatario}`);
  
  // Simular verificación de identidad
  const verificado = await verificarIdentidad(ciudadanoId);
  
  if (verificado) {
    // Simular firma de documento
    const documentoFirmado = await firmarDocumento(ciudadanoId, solicitudId);
    
    // Crear respuesta con solicitud completada
    const solicitudCompletada = {
      id: solicitudId,
      ciudadanoId: ciudadanoId,
      documentosSolicitados: Solicitud.documentosSolicitados,
      estado: "Completada"
    };
    
    const notificacionEmail = {
      tipo: "email",
      correoCarpeta: "nuevos.ciudadanos@carpeta.gov.co",
      mensaje: "La Registraduría General de la Nación a firmado el documento de identidad CC*******7890"
    };
    
    // Enviar evento de documento firmado
    try {
        await producer.send({
          topic: 'DOCUMENTO_FIRMADO',
        messages: [{
          key: ciudadanoId,
          value: JSON.stringify({
            Solicitud: solicitudCompletada,
            Notificacion: notificacionEmail,
            timestamp: new Date().toISOString()
          })
        }]
      });
      
        console.log(`Documento firmado y evento DOCUMENTO_FIRMADO enviado para ciudadano: ${ciudadanoId}`);
    } catch (error) {
      console.error('Error enviando evento de documento firmado:', error);
    }
  }
}

// Simular verificación de identidad
async function verificarIdentidad(ciudadanoId) {
  console.log(`Verificando identidad para ciudadano: ${ciudadanoId}`);
  // Simular delay de verificación
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true; // Siempre verificado para simulación
}

// Simular firma de documento
async function firmarDocumento(ciudadanoId, carpetaId) {
  console.log(`Firmando documento para ciudadano: ${ciudadanoId}`);
  
  // Simular delay de firma
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const documentoId = `doc-cedula-${ciudadanoId}`;
  const documentoFirmado = {
    id: documentoId,
    tipo: 'cedula_digital',
    estado: 'certificado',
    carpetaId: carpetaId,
    entidadEmisoraId: 'reg-0001',
    fechaEmision: new Date().toISOString().slice(0,10),
    url: `https://repositorio-documentos.gov.co/documentos/${documentoId}.pdf`,
    metadatos: [
      {
        clave: 'firmaDigital',
        valor: `firma_${ciudadanoId}_${Date.now()}`
      },
      {
        clave: 'hashDocumento',
        valor: `hash_${ciudadanoId}_${Math.random().toString(36).substr(2, 9)}`
      }
    ]
  };
  
  return documentoFirmado;
}

app.post(`${BASE}/identidad/verify`, (req,res)=>{
  const { ciudadanoId, tipoIdentificacion, numeroIdentificacion } = req.body || {};
  if (!ciudadanoId || !numeroIdentificacion) return res.status(400).json({error:'faltan campos'});
  res.json({ verificado: true, ciudadanoId, tipoIdentificacion, numeroIdentificacion });
});
app.post(`${BASE}/documento/solicitar-firma`, (req,res)=>{
  const { Solicitud, Notificacion } = req.body || {};
  if(!Solicitud || !Notificacion) return res.status(400).json({error:'Solicitud y Notificacion requeridos'});
  
  const { id, ciudadanoId, documentosSolicitados, estado } = Solicitud;
  const { tipo, destinatario, mensaje } = Notificacion;
  
  console.log(`[SOLICITUD] -> Procesando solicitud: ${id} para ciudadano: ${ciudadanoId}`);
  console.log(`[NOTIFICACION] -> Enviando ${tipo} a: ${destinatario}`);
  console.log(`[MENSAJE] -> ${mensaje}`);
  
  // Simular procesamiento de la solicitud
  const solicitudCompletada = {
    id: id,
    ciudadanoId: ciudadanoId,
    documentosSolicitados: documentosSolicitados,
    estado: "Completada"
  };
  
  const notificacionEmail = {
    tipo: "email",
    correoCarpeta: "nuevos.ciudadanos@carpeta.gov.co",
    mensaje: "La Registraduría General de la Nación a firmado el documento de identidad CC*******7890"
  };
  
  res.status(201).json({ 
    Solicitud: solicitudCompletada,
    Notificacion: notificacionEmail
  });
});

// Nuevo endpoint para subir documentos con URL
app.post(`${BASE}/documento/subir`, (req,res)=>{
  const { ciudadanoId, carpetaId, tipoDocumento } = req.body || {};
  if(!ciudadanoId || !carpetaId) return res.status(400).json({error:'ciudadanoId y carpetaId requeridos'});
  
  const documentoId = `doc-${tipoDocumento || 'cedula'}-${ciudadanoId}`;
  const url = `https://repositorio-documentos.gov.co/documentos/${documentoId}.pdf`;
  
  console.log(`[SIM-UPLOAD] Documento subido: ${url}`);
  res.status(201).json({ 
    subida: true, 
    documentoId,
    url,
    mensaje: 'Documento subido exitosamente al repositorio'
  });
});

// Inicializar Kafka y luego iniciar el servidor
initKafka().then(() => {
  app.listen(PORT, ()=> console.log('registraduria on', PORT));
}).catch(error => {
  console.error('Error inicializando Kafka:', error);
  // Iniciar servidor aunque Kafka falle
  app.listen(PORT, ()=> console.log('registraduria on', PORT, '(Kafka no disponible)'));
});
