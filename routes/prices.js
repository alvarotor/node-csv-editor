const express = require('express');
const router = express.Router();
const readline = require('readline');
const fs = require('fs');

router.get('/:fileCsv', function (req, res, next) {

  const property = req.params.fileCsv;

  const infname = __dirname + '/../csv/' + property;
  var lines = [];
  var cont = 0;

  const rl = readline.createInterface({
    input: fs.createReadStream(infname)
  });

  rl.on('line', function (line) {
    cont++;
    if (cont > 1)
      lines.push(((cont - 1) + ',' + line).split(',').slice(0, 6));
  }).on('error', function (err) {
    console.log('Error while reading file.', err);
  }).on('close', () => {
    return res.render('prices', { lines, property });
  });
});

router.get('/:fileCsv/:contFile/:value', function (req, res, next) {

  var property = req.params.fileCsv;
  var cont = 0;
  const contFile = parseInt(req.params.contFile);
  const value = req.params.value;
  const lines = [];

  const inputFile = __dirname + '/../csv/' + property;
  const outputFile = __dirname + '/../csv/TMP' + property;

  var inStream = fs.createReadStream(inputFile);
  var outStream = fs.createWriteStream(outputFile, { 'flags': 'a' });
  outStream.readable = true;
  outStream.writable = true;

  var rl = readline.createInterface(inStream, outStream);

  rl.on("line", function (line) { this.emit("pause", line); });

  rl.on("pause", function (line) {
    cont++;
    if (cont == contFile + 1) {
      var myLine = line.split(',').slice(0, 5);
      myLine[4] = value;
      outStream.write(myLine.join(',') + '\n');
    }
    else {
      if (line) {
        outStream.write(line.split(',').slice(0, 5).join(',') + '\n');
      }
    }
    this.emit("resume");
  });

  rl.on("resume", function () {
    console.log("resume");
  });

  rl.on('error', function (err) {
    console.log('Error while reading file.', err);
  });

  rl.on("close", function () {
    property = "Saved";
    fs.unlink(inputFile, function (err) {
      if (err) console.log('ERROR: ' + err);
      fs.rename(outputFile, inputFile, function (err) {
        if (err) console.log('ERROR: ' + err);
        return res.render('prices', { lines, property });
      });
    });
  });

});

router.get('/download/:fileCsv', function (req, res, next) {
  res.download(__dirname + '/../csv/' + req.params.fileCsv);
});

router.get('/delete/:fileCsv', function (req, res, next) {
  fs.unlink(__dirname + '/../csv/' + req.params.fileCsv, function (err) {
    if (err)
      return res.status(500).send(err);
    return res.redirect("/");
  });
});

router.post('/upload', function (req, res, next) {

  if (!req.files || !req.files.csvFile)
    return res.status(400).send('No files were uploaded or not files were selected.');

  let csvFile = req.files.csvFile;

  csvFile.mv(__dirname + '/../csv/' + csvFile.name, function (err) {
    if (err)
      return res.status(500).send(err);
    return res.redirect("/");
  });

});

router.get('/rooms/:fileCsv', function (req, res, next) {

  const property = req.params.fileCsv;
  var rooms = [];

  if (!property) {
    return res.status(500).send({ 'success': false });
  }

  readline.createInterface(fs.createReadStream(__dirname + '/../csv/' + property))
    .on("line", function (line) {
      const myLine = line.split(',').slice(0, 5);
      if (!rooms.includes(myLine[0]) && myLine[0] != "Room Type")
        rooms.push(myLine[0]);
    })
    .on('error', function (err) {
      console.log('Error while reading file.', err);
      return res.status(500).send({ 'success': false });
    })
    .on("close", function () {
      return res.send({ 'success': true, rooms });
    });

});

router.post('/batch', function (req, res, next) {

  const property = req.body.propertiesInput;
  const room = req.body.roomsInput;
  const price = req.body.inputPrice;
  const from = parseInt(req.body.fromInput);
  const to = parseInt(req.body.toInput);

  const inputFile = __dirname + '/../csv/' + property;
  const outputFile = __dirname + '/../csv/TMP' + property;

  var inStream = fs.createReadStream(inputFile);
  var outStream = fs.createWriteStream(outputFile, { 'flags': 'a' });
  outStream.readable = true;
  outStream.writable = true;

  var rl = readline.createInterface(inStream, outStream);

  rl.on("line", function (line) {
    var myLine = line.split(',').slice(0, 5);
    const lineTime = parseInt(myLine[3].substring(0, 2));
    if (lineTime >= from && lineTime <= to && room == myLine[0]) {
      myLine[4] = price;
      outStream.write(myLine.join(',') + '\n');
    }
    else {
      if (line) {
        outStream.write(line.split(',').slice(0, 5).join(',') + '\n');
      }
    }
  });

  rl.on('error', function (err) {
    console.log('Error while reading file.', err);
    return res.status(500).send({ 'success': false });
  });

  rl.on("close", function () {
    outStream.end(function (err) {
      if (err) {
        console.log('ERROR: ' + err);
        return res.status(500).send({ 'success': false });
      }
      outStream.close();
      fs.unlink(inputFile, function (err) {
        if (err) {
          console.log('ERROR: ' + err);
          return res.status(500).send({ 'success': false });
        }
        fs.rename(outputFile, inputFile, function (err) {
          if (err) {
            console.log('ERROR: ' + err);
            return res.status(500).send({ 'success': false });
          }
          inStream.destroy();
          outStream.destroy();
          return res.send({ 'success': true });
        });
      });
    });
  });

});

router.post('/addroom', function (req, res, next) {

  const property = req.body.addPropertyInput;
  const room = req.body.roomInput;
  const offPeakPrice = req.body.inputOffPeakPrice;
  const peakPrice = req.body.inputPeakPrice;

  const inputFile = __dirname + '/../csv/' + property;
  const outputFile = __dirname + '/../csv/TMP' + property;

  var inStream = fs.createReadStream(inputFile);
  var outStream = fs.createWriteStream(outputFile, { 'flags': 'a' });
  outStream.readable = true;
  outStream.writable = true;

  var rl = readline.createInterface(inStream, outStream);

  rl.on("line", function (line) {
    if (line) {
      outStream.write(line + '\n');
    }
  });

  rl.on('error', function (err) {
    console.log('Error while reading file.', err);
    return res.status(500).send({ 'success': false });
  });

  rl.on("close", function () {
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      for (let time = 0; time < 24; time++) {
        var price = 0;
        if (time < 16)
          price = offPeakPrice;
        else
          price = peakPrice;
        const newLine = [room, 1, dayOfWeek, time + ":00", price];
        outStream.write(newLine.join(',') + '\n');
      }
    }
    outStream.end(function (err) {
      if (err) {
        console.log('ERROR: ' + err);
        return res.status(500).send({ 'success': false });
      }
      outStream.close();
      fs.unlink(inputFile, function (err) {
        if (err) {
          console.log('ERROR: ' + err);
          return res.status(500).send({ 'success': false });
        }
        fs.rename(outputFile, inputFile, function (err) {
          if (err) {
            console.log('ERROR: ' + err);
            return res.status(500).send({ 'success': false });
          }
          inStream.destroy();
          outStream.destroy();

          return res.send({ 'success': true });
        });
      });
    });
  });

});

router.post('/deleteroom', function (req, res, next) {

  const property = req.body.propertyInput;
  const room = req.body.roomInput;

  const inputFile = __dirname + '/../csv/' + property;
  const outputFile = __dirname + '/../csv/TMP' + property;

  var inStream = fs.createReadStream(inputFile);
  var outStream = fs.createWriteStream(outputFile, { 'flags': 'a' });
  outStream.readable = true;
  outStream.writable = true;

  var rl = readline.createInterface(inStream, outStream);

  rl.on("line", function (line) {
    if (line.split(",")[0] != room) {
      outStream.write(line + '\n');
    }
  });

  rl.on('error', function (err) {
    console.log('Error while reading file.', err);
    return res.status(500).send({ 'success': false });
  });

  rl.on("close", function () {
    outStream.end(function (err) {
      if (err) {
        console.log('ERROR: ' + err);
        return res.status(500).send({ 'success': false });
      }
      outStream.close();
      fs.unlink(inputFile, function (err) {
        if (err) {
          console.log('ERROR: ' + err);
          return res.status(500).send({ 'success': false });
        }
        fs.rename(outputFile, inputFile, function (err) {
          if (err) {
            console.log('ERROR: ' + err);
            return res.status(500).send({ 'success': false });
          }
          inStream.destroy();
          outStream.destroy();

          return res.send({ 'success': true });
        });
      });
    });
  });

});

module.exports = router;
