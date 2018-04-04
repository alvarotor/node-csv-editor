const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/', function (req, res, next) {

  const csvFolder = __dirname + '/../csv/';
  var csvs = [];

  fs.readdir(csvFolder, (err, files) => {
    files.forEach(file => {
      if (path.extname(file) == '.csv') {
        csvs.push(file);
      }
    });
    return res.render('index', { csvs });
  });

});

module.exports = router;
