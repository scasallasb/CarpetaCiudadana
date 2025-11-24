// worker.js - Workers para Proceso de Registro de Carpeta Ciudadana

require('dotenv').config();
const { Camunda8 } = require('@camunda8/sdk');
const axios = require('axios');

// URLs de tus microservicios en local
const MICARPETA     = process.env.MICARPETA_URL     || 'http://localhost:3000/api/v1';
const REGISTRADURIA = process.env.REGISTRADURIA_URL || 'http://localhost:3001/api/v1';
const NOTIFICADOR   = process.env.NOTIFICADOR_URL   || 'http://localhost:3003/api/v1';
// Si en algún momento tienes un microservicio propio para MinTIC, lo apuntas aquí.
// Por ahora lo vamos a mockear:
const MINTIC        = process.env.MINTIC_URL        || null;

const c8 = new Camunda8();
const zeebe = c8.getZeebeGrpcApiClient();

async function startWorkers() {
  console.log('🚀 Iniciando Job Workers para Proceso de Registro...');

  // 1) Verificar identidad con Registraduría
  zeebe.createWorker({
    taskType: 'registraduria.verify-identity',
    taskHandler: async (job) => {
      console.log('🧩 Job: registraduria.verify-identity', job.variables);

      const {
        ciudadanoId,
        tipoIdentificacion = 'CC',
        numeroIdentificacion = '1234567890'
      } = job.variables;

      const url = `${REGISTRADURIA}/identidad/verify`;

      try {
        const resp = await axios.post(url, {
          ciudadanoId,
          tipoIdentificacion,
          numeroIdentificacion
        });

        console.log('✅ Registraduría respondió:', resp.data);

        // Ajusta esto a lo que realmente devuelve tu API
        const identidadVerificada = true;

        return job.complete({
          identidadVerificada,
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

  // 2) Informar a MinTIC (notificación de nuevo usuario)
  zeebe.createWorker({
    taskType: 'mintic.notificar-nuevo-usuario',
    taskHandler: async (job) => {
      console.log('🧩 Job: mintic.notificar-nuevo-usuario', job.variables);
      const { ciudadanoId, correo } = job.variables;

      if (!MINTIC) {
        // MOCK: solo loguea y completa
        console.log(`📨 (mock) Notificando a MinTIC nuevo usuario ${ciudadanoId} - ${correo}`);
        return job.complete({ minticNotificado: true });
      }

      try {
        // Ejemplo si tuvieras endpoint real:
        const resp = await axios.post(`${MINTIC}/nuevo-usuario`, {
          ciudadanoId,
          correo
        });

        console.log('✅ MinTIC respondió:', resp.data);
        return job.complete({ minticNotificado: true });
      } catch (err) {
        console.error('❌ Error notificando a MinTIC:', err.message);

        return job.fail({
          errorMessage: err.message,
          retries: job.retries - 1,
          retryBackOff: 3000
        });
      }
    }
  });

  // 3) Crear carpeta
  zeebe.createWorker({
    taskType: 'micarpeta.crear-carpeta',
    taskHandler: async (job) => {
      console.log('🧩 Job: micarpeta.crear-carpeta', job.variables);

      const {
        nombre = 'Juan Pérez',
        correo,
        numeroIdentificacion = '1234567890'
      } = job.variables;

      const url = `${MICARPETA}/carpeta`;

      try {
        const resp = await axios.post(url, {
          Ciudadano: {
            nombre,
            correoCarpeta: correo || 'juan.perez@carpeta.gov.co',
            tipoIdentificacion: 'CC',
            numeroIdentificacion
          }
        });

        console.log('✅ MiCarpeta creó carpeta:', resp.data);

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

  // 4) Notificar al ciudadano
  zeebe.createWorker({
    taskType: 'notificador.enviar-email',
    taskHandler: async (job) => {
      console.log('🧩 Job: notificador.enviar-email', job.variables);

      const { correo, carpetaId } = job.variables;
      const url = `${NOTIFICADOR}/email`;

      try {
        const resp = await axios.post(url, {
          destinatario: correo || 'ciudadano@example.com',
          asunto: 'Tu carpeta ciudadana ha sido creada',
          cuerpo: `Tu carpeta con id ${carpetaId} ha sido creada y está activa.`
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

  // crear los workers que no reaccionan
  zeebe.createWorker({
  taskType: 'micarpeta.proporcionar_datos',
  taskHandler: async (job) => {
    return job.complete({
      carpetaId: 'mock-123',
      carpetaEstado: 'CREADA'
    });
  }
});

  zeebe.createWorker({
  taskType: 'micarpeta.envio_cedula_firmada',
  taskHandler: async (job) => {
    return job.complete({
      carpetaId: 'mock-123',
      carpetaEstado: 'CREADA'
    });
  }
});

  zeebe.createWorker({
  taskType: 'micarpeta.recibir_solicitud',
  taskHandler: async (job) => {
    return job.complete({
      carpetaId: 'mock-123',
      carpetaEstado: 'CREADA'
    });
  }
});




  console.log('🏁 Workers registrados. Esperando jobs de Camunda Cloud...');
}

startWorkers().catch((err) => {
  console.error('💥 Error al iniciar workers:', err);
});
