'use strict';


/**
 * Listar ciudadanos afiliados a un operador
 *
 * id String 
 * returns List
 **/
exports.operadorIdCiudadanosGET = function(id) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "correoCarpeta" : "",
  "id" : "id",
  "nombre" : "nombre",
  "operadorId" : "operadorId"
}, {
  "correoCarpeta" : "",
  "id" : "id",
  "nombre" : "nombre",
  "operadorId" : "operadorId"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

