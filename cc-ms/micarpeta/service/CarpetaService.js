'use strict';


/**
 * Agrega una carpeta
 * Agrega una carpeta
 *
 * body Ciudadano Crea una nueva carpeta al ciudadano
 * id String 
 * returns Respuesta
 **/
exports.addCarpeta = function(body,id) {
  return new Promise(function(resolve, reject) {
    // Generar ID único para la carpeta
    const carpetaId = 'f9e8d7c6-b5a4-3210-9876-543210fe4567';
    
    // Crear respuesta con el nuevo modelo
    var response = {
      "Respuesta": {
        "id": carpetaId,
        "mensaje": "Tu solicitud está siendo procesada, pronto recibirás un correo para acceder a tu carpeta ciudadana"
      }
    };
    
    resolve(response);
  });
}


/**
 * Listar documentos de una carpeta
 *
 * id String 
 * returns List
 **/
exports.carpetaIdDocumentosGET = function(id) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "tipo" : "tipo",
  "estado" : "certificado",
  "entidadEmisoraId" : "entidadEmisoraId",
  "metadatos" : [ {
    "clave" : "clave",
    "valor" : "valor"
  }, {
    "clave" : "clave",
    "valor" : "valor"
  } ],
  "fechaEmision" : "2000-01-23",
  "id" : "id"
}, {
  "tipo" : "tipo",
  "estado" : "certificado",
  "entidadEmisoraId" : "entidadEmisoraId",
  "metadatos" : [ {
    "clave" : "clave",
    "valor" : "valor"
  }, {
    "clave" : "clave",
    "valor" : "valor"
  } ],
  "fechaEmision" : "2000-01-23",
  "id" : "id"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Buscar carpeta por su ID
 * Retorna un carpeta basado en un ID.
 *
 * id String ID de la carpeta a retornar
 * returns List
 **/
exports.getCarpetaId = function(id) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "documentos" : [ {
    "tipo" : "tipo",
    "estado" : "certificado",
    "entidadEmisoraId" : "entidadEmisoraId",
    "metadatos" : [ {
      "clave" : "clave",
      "valor" : "valor"
    }, {
      "clave" : "clave",
      "valor" : "valor"
    } ],
    "fechaEmision" : "2000-01-23",
    "id" : "id"
  }, {
    "tipo" : "tipo",
    "estado" : "certificado",
    "entidadEmisoraId" : "entidadEmisoraId",
    "metadatos" : [ {
      "clave" : "clave",
      "valor" : "valor"
    }, {
      "clave" : "clave",
      "valor" : "valor"
    } ],
    "fechaEmision" : "2000-01-23",
    "id" : "id"
  } ],
  "fechaCreacion" : "2000-01-23",
  "id" : "id",
  "ciudadanoId" : "ciudadanoId"
}, {
  "documentos" : [ {
    "tipo" : "tipo",
    "estado" : "certificado",
    "entidadEmisoraId" : "entidadEmisoraId",
    "metadatos" : [ {
      "clave" : "clave",
      "valor" : "valor"
    }, {
      "clave" : "clave",
      "valor" : "valor"
    } ],
    "fechaEmision" : "2000-01-23",
    "id" : "id"
  }, {
    "tipo" : "tipo",
    "estado" : "certificado",
    "entidadEmisoraId" : "entidadEmisoraId",
    "metadatos" : [ {
      "clave" : "clave",
      "valor" : "valor"
    }, {
      "clave" : "clave",
      "valor" : "valor"
    } ],
    "fechaEmision" : "2000-01-23",
    "id" : "id"
  } ],
  "fechaCreacion" : "2000-01-23",
  "id" : "id",
  "ciudadanoId" : "ciudadanoId"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Actualizar una carpeta existente.
 * Actulizar una carpeta existente por su ID
 *
 * body Carpeta Actulizar una carpeta existente por su ID
 * id String 
 * returns Carpeta
 **/
exports.updateCarpeta = function(body,id) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "documentos" : [ {
    "tipo" : "tipo",
    "estado" : "certificado",
    "entidadEmisoraId" : "entidadEmisoraId",
    "metadatos" : [ {
      "clave" : "clave",
      "valor" : "valor"
    }, {
      "clave" : "clave",
      "valor" : "valor"
    } ],
    "fechaEmision" : "2000-01-23",
    "id" : "id"
  }, {
    "tipo" : "tipo",
    "estado" : "certificado",
    "entidadEmisoraId" : "entidadEmisoraId",
    "metadatos" : [ {
      "clave" : "clave",
      "valor" : "valor"
    }, {
      "clave" : "clave",
      "valor" : "valor"
    } ],
    "fechaEmision" : "2000-01-23",
    "id" : "id"
  } ],
  "fechaCreacion" : "2000-01-23",
  "id" : "id",
  "ciudadanoId" : "ciudadanoId"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

