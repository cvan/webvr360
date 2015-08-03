(function () {

var pathname = window.location.pathname;
var pathnameChunks = pathname.split('/');
var roomName = pathnameChunks[2];

if (pathname === '/' && localStorage.previousPath) {
  window.location.href = localStorage.previousPath;
  return;
}

if (!roomName) {
  var roomVerb = window.location.pathname.split('/')[1] || 'manage';
  window.location.href = '/' + roomVerb + '/' + Math.random().toString(36).substr(2, 5);
  return;
}

localStorage.previousPath = window.location.href;


var DEFAULT_URLS = [
  'https://www.youtube.com/watch?v=scL_bXF7k_Q',
  'https://www.youtube.com/watch?v=huC3s9lsf4k',
  'https://www.youtube.com/watch?v=hI7-Fsb9gaY',
];

var appback = new Appback({
  baseUrl: 'https://webvr.appback.com/'
});

var state = {
  infoCache: {},
  urls: []
};
state.urls = getListOfUrls();
loadCache();
updateAndRender();

function loadCache() {
  state.infoCache = JSON.parse(localStorage.infoCache || '{}');
}

function persistCache() {
  localStorage.infoCache = JSON.stringify(state.infoCache);
}


function hashCode(str) {
  var len = str.length;
  if (!len) {
    return '0';
  }

  var chr;
  var hash = 0;
  var i = 0;

  for (; i < len; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;  // Convert to a 32-bit integer.
  }

  return String(Math.abs(hash));
}


var storeName = 'video-' + roomName;
var videoStore = appback.store(storeName);

window.videoStore = videoStore;


videoStore.findAll().done(function (items) {
  console.log('findAll', items);

  if (items.length) {
    addUrlsFromCloud(items, true);
  } else {
    urls.value = DEFAULT_URLS.join('\n');
    processUrlsFromInput();
  }
}).fail(function (err) {
  console.error('Could not find all:', err);
});


videoStore.on('change', function (type, item) {
  console.log('change', type, item);

  // TODO: Make sure this is tested when changes are made from another user.
  addUrlsFromCloud(item);
});

function removeVideo(url, options) {
  console.log('removeVideo');
  options = options || {};
  var id = hashCode(url);
  return appback.store.remove(storeName, id, options);
}


function updateOrAddVideo(url, position, options) {
  console.log('updateOrAddVideo');
  options = options || {};
  var id = hashCode(url);
  return appback.store.updateOrAdd(storeName, id, {
    id: id,
    url: url,
    position: position,
  }, options);
}



document.title = roomName + ' | ' + document.title;

function getInfo(url) {
  return new Promise(function (resolve, reject) {

    if (url in state.infoCache) {
      return resolve(state.infoCache[url]);
    }

    fetch('/api/video/info?url=' + url).then(function (res) {
      return res.json();
    }).then(function (data) {
      state.infoCache[url] = data;
      persistCache();
      resolve(data);
    }).catch(reject);

  });
}

function getListOfUrls() {
  return urls.value.replace(/\n+/g, '\n').replace(/\n+$/g, '').split('\n');
  // return urls.value.replace(/\n+$/g, '').split('\n');
}

function eq(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

urls.addEventListener('input', processUrlsFromInput);

function processUrlsFromInput(e) {
  console.log('processUrlsFromInput', e && e.type);

  // console.log('urls', urls.value);
  urls.value = urls.value.replace(/\n+/g, '\n');

  var listNew = getListOfUrls();

  if (!eq(state.urls, listNew)) {
    state.urls.forEach(function (url) {
      if (listNew.indexOf(url) === -1) {
        // Delete the item.
        // removeVideo(url, {silent: true});
      }
    });

    state.urls = listNew;

    updateAndRender(true);
  }
}

function addUrlsFromCloud(items) {
  console.log('addUrlsFromCloud', items);

  if (!Array.isArray(items)) {
    items = [items];
  }

  state.urls = [];

  items.forEach(function (item) {
    if (item.url) {
      state.urls[item.position] = item.url;
    }
  });

  if (state.urls.length) {
    urls.value = state.urls.join('\n') + '\n';
  } else {
    urls.value = '';
  }

  updateAndRender();
}


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

function deleteAllVideo() {
  videoStore.removeAll();
}


function updateAndRender(postToCloud) {
  var proms = [];
  state.urls.forEach(function (url) {
    console.log('state.urls.forEach', url);
    if (url) {
      proms.push(getInfo(url));
    }
  });

  if (!proms.length) {
    previews.innerHTML = '';
    return;
  }

  var html = '';

  Promise.all(proms).then(function (info) {

    console.log('info', info);
    info.forEach(function (item, idx) {
      html += (
        '<li class="preview">' +
        '<iframe class="embed--yt" src="https://youtube.com/embed/' + escape_(item.video_id) + '?modestbranding=1&rel=0&autohide=1" allowfullscreen></iframe>' +
        '</li>\n'
      );

      updateOrAddVideo(item.loaderUrl, idx, {silent: true});
    });

    previews.innerHTML = html;

  }).catch(function (err) {
    console.log('Could not get info', err);
  });
}

// TODO: Don't choke on dupes.


form.addEventListener('submit', function (e) {

  e.preventDefault();
  window.location.href = '/play/' + roomName;

});

})();
