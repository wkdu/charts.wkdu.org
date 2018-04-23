const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const moment = require('moment');

const app = express();
app.use(cors());

const apiRouter = express.Router();

const dataFilePath = (filename) => path.join(__dirname, `scraper/data/${filename}`);
const buildFilePath = path.join(__dirname, 'build');

// API routes
apiRouter.get('/weeks/', (req, res) => {
  res.set('Content-Type', 'application/json');

  let jsonStream = fs.createReadStream(dataFilePath('chart_week.json'));

  jsonStream.on('error', (err) => {
    res.status(404).send({
      code: 404,
      message: 'File not found'
    });
  });

  jsonStream.pipe(res);

});

apiRouter.get('/week/:mmddyyyy', (req, res) => {
  res.set('Content-Type', 'application/json');

  let { mmddyyyy } = req.params;
  if (mmddyyyy && mmddyyyy.toString().length === 8) {
    let formattedDate = moment(mmddyyyy.toString(), 'MMDDYYYY').format('MM_DD_YY');
    let jsonFile = `weeks/week_ending_${formattedDate}.json`;
    let jsonStream = fs.createReadStream(dataFilePath(jsonFile));

    jsonStream.on('error', (err) => {
      res.status(404).send({
        code: 404,
        message: 'File not found'
      });
      console.log(err);
    });

    jsonStream.pipe(res);

  } else {
    res.status(400).send({
      code: 400,
      message: 'Bad Request'
    });
  }
});

// apiRouter.get('/year/:yyyy', (req, res) => {});
// apiRouter.get('/years', (req, res) => {});

app.use('/api', apiRouter);
app.use('/', express.static(buildFilePath));

const serverPort = process.env.PORT || 8082;
const server = app.listen(serverPort, function () {
    let port = server.address().port;
    console.log('charts.wkdu.org server is listening on port %s', port);
})
