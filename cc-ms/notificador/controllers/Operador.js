'use strict';

var utils = require('../utils/writer.js');
var Operador = require('../service/OperadorService');

module.exports.operadorIdCiudadanosGET = function operadorIdCiudadanosGET (req, res, next, id) {
  Operador.operadorIdCiudadanosGET(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
