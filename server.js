var bodyParser = require('body-parser');
var cors = require('cors');
var express = require('express');
var keenio = require('express-keenio');
var morgan = require('morgan');
var nunjucks = require('nunjucks');
var redis = require('redis');
var request = require('request');
var shortid = require('shortid');

var db = require('./lib/db');
var getInfo = require('./lib/get-info');


var NODE_ENV = process.env.NODE_ENVIRONMENT || 'development';
var USE_SSL = process.env.USE_SSL;
var app = express();


if (process.env.KEEN_API_URL) {
  keenio.configure({
    client: {
      projectId: process.env.KEEN_PROJECT_ID,
      writeKey: process.env.KEEN_WRITE_KEY
    }
  });

  // Enable Express Middleware for Keen IO analytics.
  app.use(keenio.handleAll());
}

app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use(express.static('public'));

app.use(cors());

// For parsing text (used below).
var textBodyParser = bodyParser.text();

// For parsing JSON.
app.use(bodyParser.json({type: 'json'}))

// For parsing `application/x-www-form-urlencoded`.
app.use(bodyParser.urlencoded({extended: true}));


var server = app.listen(process.env.PORT || '3000', function () {
  var address = server.address();
  console.log('Listening at %s:%s', address.address, address.port);
});


/**
 * Sample usage:
 *
 * http://localhost:3000/api/video/info?preset=24&url=https://www.youtube.com/watch?v=scL_bXF7k_Q
 * http://localhost:3000/api/video/info?preset=24&url=scL_bXF7k_Q
 *
 */
function videoInfo(req, res) {
  getInfo(req.query).then(function (body) {
    console.log(body[0]);
    res.send(body[0]);
  }).catch(function (err) {
    console.error(err);
    res.status(400).send({
      success: false,
      error: 'Could not fetch info'
    });
  });
}


/**
 * Sample usage:
 *
 * http://localhost:3000/api/video/audio?preset=24&url=https://www.youtube.com/watch?v=scL_bXF7k_Q
 * http://localhost:3000/api/video/audio?preset=24&url=scL_bXF7k_Q
 *
 */
function videoAudio(req, res) {
  getInfo(req.query).then(function (body) {
    request.get(body[1].audio.url).pipe(res);
  }).catch(function (err) {
    console.error(err);
    res.status(400).send({
      success: false,
      error: 'Could not fetch audio'
    });
  });
}


/**
 * Sample usage:
 *
 * http://localhost:3000/api/video/video?preset=hd&url=https://www.youtube.com/watch?v=scL_bXF7k_Q
 * http://localhost:3000/api/video/video?preset=hd&url=scL_bXF7k_Q
 *
 */
function videoVideo(req, res) {
  getInfo(req.query).then(function (body) {
    request.get(body[1].video.url).pipe(res);
  }).catch(function (err) {
    console.error(err);
    res.status(400).send({
      success: false,
      error: 'Could not fetch video'
    });
  });
}


function roomManage(req, res) {
  res.sendFile(__dirname + '/public/manage.html', function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
  });
}

function roomPlay(req, res) {
  res.sendFile(__dirname + '/public/play.html', function (err) {
    if (err) {
      console.log(err);
      res.status(err.status).end();
    }
  });
}

app.get('/', roomManage);
app.get(/(manage|edit|create)/, roomManage);
app.get(/(manage|edit|create)\/:room/, roomManage);

app.get('/play', roomPlay);
app.get('/play/:room', roomPlay);


app.get('/api/video/info', videoInfo);
app.get('/api/video/audio', videoAudio);
app.get('/api/video/video', videoVideo);
