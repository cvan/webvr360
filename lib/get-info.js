require('es6-promise').polyfill();

var urllib = require('url');

var PresetManager = require('./preset-manager');
var ytdl = require('ytdl-core');

var errorCodes = require('../data/error-codes');


function getInfo(options) {
  return new Promise(function (resolve, reject) {

    if (typeof options !== 'object') {
      options = {url: options};
    }

    if (!options.preset) {
      options.preset = '24';
    }

    if (options.url.indexOf('http') === -1) {
      options.url = 'https://www.youtube.com/watch?v=' + options.url;
    }

    var presets = new PresetManager(options.presets);
    options.parsedUrl = urllib.parse(options.url, true, true);

    ytdl.getInfo(options.url, {
      downloadUrl: true
    }, function (err, info) {

      if (err) {
        return reject(errorCodes.FAILED_TO_GET_INFO);
      }

      var presetFunc = presets[options.preset];

      if (typeof presetFunc === 'undefined') {
        var errMsg = new Error('Preset "' + options.preset + '" is not defined!');
        return reject(errMsg);
      }

      var bestFormats = presetFunc(info.formats);

      resolve([info, bestFormats]);
    });

  });
}


module.exports = getInfo;
