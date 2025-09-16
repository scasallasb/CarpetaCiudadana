'use strict';

var utils = require('../utils/writer.js');
var Carpeta = require('../service/CarpetaService');

module.exports.addCarpeta = function addCarpeta (req, res, next, body, id) {
  Carpeta.addCarpeta(body, id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.carpetaIdDocumentosGET = function carpetaIdDocumentosGET (req, res, next, id) {
  Carpeta.carpetaIdDocumentosGET(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCarpetaId = function getCarpetaId (req, res, next, id) {
  Carpeta.getCarpetaId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateCarpeta = function updateCarpeta (req, res, next, body, id) {
  Carpeta.updateCarpeta(body, id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
