// worker.js - versión CommonJS (compatible con Node.js sin need config)

require('dotenv').config();
const { Camunda8 } = require('@camunda8/sdk');
const axios = require('axios');

// URLs de tus microservicios (las mismas del script bash)
const MICARPETA = process.env.MICARPETA_URL || 'http://localhost:3000/api/v1';
const REGISTRADURIA = process.env.REGISTRADURIA_URL || 'http://localhost:3001/api/v1';
const NOTIFICADOR = process.env.NOTIFICADOR_URL || 'http://localhost:3003/api/v1';

// Crear cliente Camunda 8 usando el .env
const c8 = new Camunda8();
const zeebe = c8.getZeebeGrpcApiClient();

async function startWorkers() {
  console.log('🚀 Iniciando Job Workers para Carpeta Ciudadana...');

  // -----------------------------
  // Worker 1: verificar identidad
  // -----------------------------
  zeebe.createWorker({
    taskType: 'registraduria.verify-identity',
    taskHandler: async (job) => {
      console.log('🧩 Job: registraduria.verify-identity', job.variables);

      const { ciudadanoId, tipoIdentificacion, numeroIdentificacion } = job.variables;
      const url = `${REGISTRADURIA}/identidad/verify`;

      try {
        const resp = await axios.post(url, {
          ciudadanoId,
          tipoIdentificacion,
          numeroIdentificacion
        });

        console.log('✅ Registraduría respondió:', resp.data);

        return job.complete({
          identidadVerificada: true,
          detalleValidacion: resp.data
        });

      } catch (err) {
        console.error('❌ Error en Registraduría:', err.message);

        return job.fail({
          errorMessage: err.message,
          retries: job.retries - 1,
          retryBackOff: 3000
        });
      }
    }
  });

  // -----------------------------
  // Worker 2: crear carpeta
  // -----------------------------
  zeebe.createWorker({
    taskType: 'micarpeta.crear-carpeta',
    taskHandler: async (job) => {
      console.log('🧩 Job: micarpeta.crear-carpeta', job.variables);

      const { nombre, correoCarpeta, numeroIdentificacion } = job.variables;
      const url = `${MICARPETA}/carpeta`;

      try {
        const resp = await axios.post(url, {
          Ciudadano: {
            nombre,
            correoCarpeta,
            tipoIdentificacion: 'CC',
            numeroIdentificacion
          }
        });

        console.log('✅ MiCarpeta respondió:', resp.data);

        return job.complete({
          carpetaId: resp.data.id,
          carpetaEstado: resp.data.estado || 'CREADA'
        });

      } catch (err) {
        console.error('❌ Error creando carpeta:', err.message);

        return job.fail({
          errorMessage: err.message,
          retries: job.retries - 1,
          retryBackOff: 3000
        });
      }
    }
  });

  // -----------------------------
  // Worker 3: notificar MINTIC
  // -----------------------------
  zeebe.createWorker({
    taskType: 'mintic.notificar-carpeta',
    taskHandler: async (job) => {
      console.log('🧩 Job: mintic.notificar-carpeta', job.variables);

      const { carpetaId, ciudadanoId } = job.variables;
      const url = `${NOTIFICADOR}/email`;

      try {
        const resp = await axios.post(url, {
          asunto: 'Carpeta creada',
          destinatario: 'ciudadano@example.com',
          cuerpo: `La carpeta ${carpetaId} para el ciudadano ${ciudadanoId} ha sido creada`
        });

        console.log('✅ Notificador respondió:', resp.data);

        return job.complete({
          notificacionEnviada: true
        });

      } catch (err) {
        console.error('❌ Error enviando notificación:', err.message);

        return job.fail({
          errorMessage: err.message,
          retries: job.retries - 1,
          retryBackOff: 3000
        });
      }
    }
  });

  console.log('🏁 Workers registrados. Esperando jobs de Camunda Cloud...');
}

startWorkers().catch((err) => {
  console.error('💥 Error al iniciar workers:', err);
});
