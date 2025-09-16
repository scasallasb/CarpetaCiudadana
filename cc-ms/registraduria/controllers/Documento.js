'use strict';

var utils = require('../utils/writer.js');
var Documento = require('../service/DocumentoService');

module.exports.documentoPOST = function documentoPOST (req, res, next, body) {
  Documento.documentoPOST(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
