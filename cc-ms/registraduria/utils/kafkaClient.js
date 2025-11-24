/**
 * Kafka Client con manejo robusto de errores
 * Incluye: reconexión automática, reintentos, timeouts, circuit breaker
 */

const { Kafka, logLevel } = require('kafkajs');

class KafkaClientManager {
  constructor(config) {
    this.clientId = config.clientId;
    this.brokers = Array.isArray(config.brokers) ? config.brokers : [config.brokers || 'localhost:9092'];
    this.groupId = config.groupId;
    this.maxRetries = config.maxRetries || 5;
    this.retryDelay = config.retryDelay || 1000; // 1 segundo base
    this.connectionTimeout = config.connectionTimeout || 10000; // 10 segundos
    this.requestTimeout = config.requestTimeout || 30000; // 30 segundos
    
    // Circuit breaker state
    this.circuitBreakerState = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.failureThreshold = 5;
    this.resetTimeout = 60000; // 1 minuto
    this.lastFailureTime = null;
    
    // Connection state
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    
    // Create Kafka instance with retry configuration
    this.kafka = new Kafka({
      clientId: this.clientId,
      brokers: this.brokers,
      connectionTimeout: this.connectionTimeout,
      requestTimeout: this.requestTimeout,
      retry: {
        initialRetryTime: 100,
        retries: this.maxRetries,
        multiplier: 2,
        maxRetryTime: 30000
      },
      logLevel: logLevel.INFO,
      logCreator: () => ({ level, log }) => {
        if (level >= logLevel.ERROR) {
          console.error(`[Kafka ${this.clientId}]`, log);
        }
      }
    });
    
    this.producer = null;
    this.consumer = null;
  }

  /**
   * Verifica el estado del circuit breaker
   */
  checkCircuitBreaker() {
    if (this.circuitBreakerState === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.resetTimeout) {
        this.circuitBreakerState = 'HALF_OPEN';
        this.failureCount = 0;
        console.log(`[Kafka ${this.clientId}] Circuit breaker: HALF_OPEN (intentando reconexión)`);
        return true;
      }
      return false;
    }
    return true;
  }

  /**
   * Registra un fallo en el circuit breaker
   */
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold && this.circuitBreakerState !== 'OPEN') {
      this.circuitBreakerState = 'OPEN';
      console.error(`[Kafka ${this.clientId}] Circuit breaker: OPEN (demasiados fallos)`);
    }
  }

  /**
   * Registra un éxito en el circuit breaker
   */
  recordSuccess() {
    if (this.circuitBreakerState === 'HALF_OPEN') {
      this.circuitBreakerState = 'CLOSED';
      this.failureCount = 0;
      console.log(`[Kafka ${this.clientId}] Circuit breaker: CLOSED (reconexión exitosa)`);
    } else if (this.circuitBreakerState === 'CLOSED') {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  /**
   * Retry con backoff exponencial
   */
  async retryWithBackoff(fn, operation = 'operation', maxRetries = this.maxRetries) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (!this.checkCircuitBreaker()) {
          throw new Error('Circuit breaker is OPEN');
        }
        
        const result = await Promise.race([
          fn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timeout')), this.requestTimeout)
          )
        ]);
        
        this.recordSuccess();
        this.reconnectAttempts = 0;
        return result;
      } catch (error) {
        lastError = error;
        this.recordFailure();
        
        if (attempt < maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt);
          console.warn(
            `[Kafka ${this.clientId}] ${operation} falló (intento ${attempt + 1}/${maxRetries + 1}):`,
            error.message,
            `- Reintentando en ${delay}ms...`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error(
            `[Kafka ${this.clientId}] ${operation} falló después de ${maxRetries + 1} intentos:`,
            error.message
          );
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Conecta el producer con manejo de errores
   */
  async connectProducer() {
    if (this.producer && this.isConnected) {
      return this.producer;
    }

    try {
      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
        retry: {
          initialRetryTime: 100,
          retries: this.maxRetries,
          multiplier: 2,
          maxRetryTime: 30000
        }
      });

      await this.retryWithBackoff(
        () => this.producer.connect(),
        'Producer connection'
      );

      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log(`[Kafka ${this.clientId}] Producer conectado exitosamente`);

      // Manejar desconexiones
      this.producer.on(this.producer.events.DISCONNECT, () => {
        console.warn(`[Kafka ${this.clientId}] Producer desconectado`);
        this.isConnected = false;
        this.scheduleReconnect('producer');
      });

      return this.producer;
    } catch (error) {
      console.error(`[Kafka ${this.clientId}] Error conectando producer:`, error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Conecta el consumer con manejo de errores
   */
  async connectConsumer() {
    if (!this.groupId) {
      throw new Error('groupId es requerido para el consumer');
    }

    if (this.consumer && this.isConnected) {
      return this.consumer;
    }

    try {
      this.consumer = this.kafka.consumer({
        groupId: this.groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxBytesPerPartition: 1048576, // 1MB
        retry: {
          initialRetryTime: 100,
          retries: this.maxRetries,
          multiplier: 2,
          maxRetryTime: 30000
        }
      });

      await this.retryWithBackoff(
        () => this.consumer.connect(),
        'Consumer connection'
      );

      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log(`[Kafka ${this.clientId}] Consumer conectado exitosamente`);

      // Manejar desconexiones
      this.consumer.on(this.consumer.events.DISCONNECT, () => {
        console.warn(`[Kafka ${this.clientId}] Consumer desconectado`);
        this.isConnected = false;
        this.scheduleReconnect('consumer');
      });

      // Manejar errores de procesamiento
      this.consumer.on(this.consumer.events.CRASH, async ({ payload: { error } }) => {
        console.error(`[Kafka ${this.clientId}] Consumer crash:`, error.message);
        this.isConnected = false;
        await this.scheduleReconnect('consumer');
      });

      return this.consumer;
    } catch (error) {
      console.error(`[Kafka ${this.clientId}] Error conectando consumer:`, error.message);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Programa reconexión automática
   */
  scheduleReconnect(type) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`[Kafka ${this.clientId}] Máximo de intentos de reconexión alcanzado`);
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.retryDelay * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(
      `[Kafka ${this.clientId}] Programando reconexión de ${type} en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(async () => {
      try {
        if (type === 'producer') {
          await this.connectProducer();
        } else if (type === 'consumer') {
          await this.connectConsumer();
        }
      } catch (error) {
        console.error(`[Kafka ${this.clientId}] Error en reconexión de ${type}:`, error.message);
        this.scheduleReconnect(type);
      }
    }, delay);
  }

  /**
   * Envía mensaje con reintentos
   */
  async sendMessage(topic, messages, options = {}) {
    try {
      if (!this.producer || !this.isConnected) {
        await this.connectProducer();
      }

      return await this.retryWithBackoff(
        async () => {
          const result = await this.producer.send({
            topic,
            messages: Array.isArray(messages) ? messages : [messages],
            ...options
          });
          return result;
        },
        `Send message to ${topic}`
      );
    } catch (error) {
      console.error(`[Kafka ${this.clientId}] Error enviando mensaje a ${topic}:`, error.message);
      throw error;
    }
  }

  /**
   * Suscribe consumer a tópicos
   */
  async subscribe(topics) {
    try {
      if (!this.consumer || !this.isConnected) {
        await this.connectConsumer();
      }

      const topicArray = Array.isArray(topics) ? topics : [topics];
      await this.retryWithBackoff(
        () => this.consumer.subscribe({ topics: topicArray, fromBeginning: false }),
        `Subscribe to topics: ${topicArray.join(', ')}`
      );

      console.log(`[Kafka ${this.clientId}] Suscrito a tópicos: ${topicArray.join(', ')}`);
    } catch (error) {
      console.error(`[Kafka ${this.clientId}] Error suscribiendo a tópicos:`, error.message);
      throw error;
    }
  }

  /**
   * Ejecuta consumer con manejo de errores
   */
  async runConsumer(eachMessageHandler) {
    try {
      if (!this.consumer || !this.isConnected) {
        await this.connectConsumer();
      }

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const data = JSON.parse(message.value.toString());
            await eachMessageHandler({ topic, partition, message, data });
          } catch (error) {
            console.error(
              `[Kafka ${this.clientId}] Error procesando mensaje de ${topic}:`,
              error.message,
              `- Offset: ${message.offset}, Partition: ${partition}`
            );
            // No relanzamos el error para que el consumer continúe procesando otros mensajes
          }
        },
        eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
          try {
            for (const message of batch.messages) {
              try {
                const data = JSON.parse(message.value.toString());
                await eachMessageHandler({
                  topic: batch.topic,
                  partition: batch.partition,
                  message,
                  data
                });
                resolveOffset(message.offset);
                await heartbeat();
              } catch (error) {
                console.error(
                  `[Kafka ${this.clientId}] Error procesando mensaje en batch:`,
                  error.message
                );
                // Continuar con el siguiente mensaje
              }
            }
          } catch (error) {
            console.error(`[Kafka ${this.clientId}] Error procesando batch:`, error.message);
          }
        }
      });
    } catch (error) {
      console.error(`[Kafka ${this.clientId}] Error ejecutando consumer:`, error.message);
      throw error;
    }
  }

  /**
   * Verifica salud de la conexión
   */
  async healthCheck() {
    try {
      if (!this.checkCircuitBreaker()) {
        return { healthy: false, reason: 'Circuit breaker is OPEN' };
      }

      if (this.producer) {
        const admin = this.kafka.admin();
        await admin.connect();
        const metadata = await admin.fetchMetadata();
        await admin.disconnect();
        return { healthy: true, brokers: metadata.brokers.length };
      }

      return { healthy: this.isConnected };
    } catch (error) {
      return { healthy: false, reason: error.message };
    }
  }

  /**
   * Desconecta todos los clientes
   */
  async disconnect() {
    const promises = [];
    
    if (this.producer) {
      promises.push(
        this.producer.disconnect().catch(err => 
          console.error(`[Kafka ${this.clientId}] Error desconectando producer:`, err.message)
        )
      );
    }
    
    if (this.consumer) {
      promises.push(
        this.consumer.disconnect().catch(err => 
          console.error(`[Kafka ${this.clientId}] Error desconectando consumer:`, err.message)
        )
      );
    }
    
    await Promise.all(promises);
    this.isConnected = false;
    console.log(`[Kafka ${this.clientId}] Desconectado`);
  }
}

module.exports = KafkaClientManager;

