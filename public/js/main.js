(function () {

var roomName = window.location.pathname.split('/')[2];

if (!roomName) {
  window.location.href = '/manage/' + Math.random().toString(36).substr(2, 5);
  return;
}

document.title = roomName + ' | ' + document.title;

var infoCache = {};

loadCache();

function loadCache() {
  infoCache = JSON.parse(localStorage.infoCache || '{}');
}

window.infoCache = infoCache;

function persistCache() {
  localStorage.infoCache = JSON.stringify(infoCache);
}

function getInfo(url) {
  return new Promise(function (resolve, reject) {

    if (url in infoCache) {
      return resolve(infoCache[url]);
    }

    fetch('/api/video/info?url=' + url).then(function (res) {
      return res.json();
    }).then(function (data) {
      infoCache[url] = data;
      persistCache();
      resolve(data);
    }).catch(reject);

  });
}

function getListOfUrls() {
  return urls.value.replace(/ /g, '').replace(/\n+$/g, '').split('\n');
}

function eq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

var state = {};
state.list = getListOfUrls();

renderSidebar();

urls.addEventListener('input', function () {

  var listNew = getListOfUrls();
  if (!eq(state.list, listNew)) {
    state.list = getListOfUrls();
    updateUrlsInTheCloud();
    renderSidebar();
  }

});

var ESCAPE_LOOKUP = {
  '&': '&amp;',
  '>': '&gt;',
  '<': '&lt;',
  '"': '&quot;',
  "'": '&#x27;'
};

var ESCAPE_REGEX = /[&><"']/g;

function escaper(match) {
  return ESCAPE_LOOKUP[match];
}

/**
 * Escapes text to prevent scripting attacks.
 *
 * @param {*} text Text value to escape.
 * @return {string} An escaped string.
 */
function escape_(text) {
  return ('' + text).replace(ESCAPE_REGEX, escaper);
}


function renderSidebar() {
  var proms = [];
  state.list.forEach(function (url) {
    proms.push(getInfo(url));
  });

  var html = '';

  Promise.all(proms).then(function (info) {

    console.log('info', info);
    info.forEach(function (item) {
      html += (
        '<li class="preview">' +
        '<iframe class="embed--yt" src="https://youtube.com/embed/' + item.video_id + '?modestbranding=1&rel=0&autohide=1" allowfullscreen></iframe>' +
        '</li>\n'
      );
    });

    previews.innerHTML = html;

  }).catch(function (err) {
    console.log('Could not get info', err);
  });
}

function updateUrlsInTheCloud() {
  WorldManager
}

function WorldManager() {
  this.storeUrl = 'https://webvr.firebaseio.com/webvr360/worlds';
  this.ref = new Firebase(self.storeUrl);
}

WorldManager.prototype = {
  init: function () {
    // this.ref = new Firebase(self.storeUrl);
    // self.ref.on('child_added', function (snapshot) {
    //   var key = snapshot.key();
    //   var data = snapshot.val();
    //   data.key = key;

    //   var idx = panoAddLater(data);
    //   panoIdxByKey[key] = idx;
    // });
  },
  create: function () {

    this.ref.promisePush({
      video: self.pending.audio.cdnUrl.replace(/^http:/, 'https:') + audioExt,
      image: self.pending.image.cdnUrl.replace(/^http:/, 'https:') + imageExt
    }).then(function (newRef) {
      var key = newRef.key();
      console.log('Successfully created new world: %s', key);
    });

  },
};

// self.WorldManager = new WorldManager();

form.addEventListener('submit', function (e) {

  e.preventDefault();
  window.location.href = '/play/' + roomName;

});

})();
