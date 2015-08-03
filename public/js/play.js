(function () {

var roomName = window.location.pathname.split('/')[2];

if (!roomName) {
  window.location.href = '/';
  return;
}

document.title = 'Play ' + roomName + ' | ' + document.title;

var appback = new Appback({
  baseUrl: 'https://webvr.appback.com/'
});

var state = {
  counter: -1,
  videos: [],
  videoCurrent: null
};

var storeName = 'video-' + roomName;
var videoStore = appback.store(storeName);

window.videoStore = videoStore;

videoStore.findAll().done(function (items) {
  console.log('findAll', items);

  // Sort videos by `position`.
  items.forEach(function (item) {
    if (state.videos[item.position]) {
      return;
    }
    state.videos[item.position] = item;
  });

  videoForward();

  // TODO: Update `state.videos` on change.
}).fail(function (err) {
  console.error('Could not find all:', err);
});


function videoSetCounter(val) {
  if (state.counter === val) {
    return state.counter;
  }

  state.counter = val;

  if (state.counter < 0) {
    state.counter = state.videos.length - 1;
  }

  if (state.counter === state.videos.length) {
    state.counter = 0;
  }

  return state.counter;
}

function videoJump(videoIdxOrObj) {
  var videoIdx = videoIdxOrObj;

  if (typeof videoIdxOrObj === 'object') {
    videoIdx = state.videos.indexOf(videoIdxOrObj);
  }

  return videoPlay(videoIdx);
}

function videoStep(increment) {
  return videoPlay(state.counter + increment);
}

function videoBack() {
  return videoPlay(state.counter - 1);
}

function videoForward() {
  return videoPlay(state.counter + 1);
}

function videoPlay(videoIdx) {
  videoIdx = videoSetCounter(videoIdx);

  if (state.videoCurrent && state.videoCurrent._idx === videoIdx) {
    // We're already viewing that video, silly.
    return videoIdx;
  }

  state.videoCurrent = state.videos[videoIdx];

  if (iframe.src === 'http://localhost:8080/') {
    iframe.src = 'http://localhost:8080/#{"fullscreen":true,"controls":false,"autoplay":true,"video":"http://localhost:3000/api/video/video/?url=' + state.videoCurrent.url + '"}';
  } else {
    iframe.contentWindow.postMessage({
      fullscreen: true,
      controls: false,
      autoplay: true,
      video: 'http://localhost:3000/api/video/video/?url=' + state.videoCurrent.url
    }, '*');
  }
}


function onkey(e) {
  // e.stopPropagation();

console.log('onkey', e);

  if (e.keyCode === 90) {
    // controls.zeroSensor();
  } else if (e.keyCode === 37) {
    videoBack();
  } else if (e.keyCode === 39) {
    videoForward();
  } else if (e.key === 'c' || e.key === 'n' || e.key == 'u') {
    window.location.href = '/create';
  } else {
    console.log('post message key', e);
    iframe.contentWindow.postMessage({
      event: {
        keyCode: e.keyCode,
        charCode: e.charCode
      }
    }, '*');
  }
}

document.body.addEventListener('keyup', function (e) {
  console.log('keyup', e);
  if (e.alt || e.ctrlKey || e.metaKey) {
    return;
  }

  onkey(e);
});

window.addEventListener('message', function (e) {
  if (typeof e.data === 'object') {
    console.log('got keypress from iframe window');
    onkey(e.data.event);
  }
});

})();
