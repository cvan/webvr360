(function () {

var roomName = window.location.pathname.split('/')[2];

if (!roomName) {
  window.location.href = '/manage/' + Math.random().toString(36).substr(2, 5);
  return;
}

document.title = 'Play ' + roomName + ' | ' + document.title;


var infoCache = {};

loadCache();

function loadCache() {
  infoCache = JSON.parse(localStorage.infoCache || '{}');
}

window.infoCache = infoCache;


function getAudio(url) {
  return new Promise(function (resolve, reject) {

    fetch('/video/audio?url=' + url).then(function (res) {
      return res.json();
    }).then(function (data) {
      resolve(data);
    }).catch(reject);

  });
}

function getVideo(url) {
  return new Promise(function (resolve, reject) {

    fetch('/video/video?url=' + url).then(function (res) {
      return res.json();
    }).then(function (data) {
      resolve(data);
    }).catch(reject);

  });
}

var videos = Object.keys(infoCache).map(function (key) {
  return {url: key};
});

// var state = {};
// state.list = [
//   'https://www.youtube.com/watch?v=scL_bXF7k_Q',
//   'https://www.youtube.com/watch?v=huC3s9lsf4k',
//   'https://www.youtube.com/watch?v=hI7-Fsb9gaY',
// ];

// var videos = [
//   {url: 'https://www.youtube.com/watch?v=scL_bXF7k_Q'},
//   {url: 'https://www.youtube.com/watch?v=huC3s9lsf4k'},
//   {url: 'https://www.youtube.com/watch?v=hI7-Fsb9gaY'},
// ];

var counter = -1;
var videoCurrent;


function videoSetCounter(val, videos) {
  if (counter === val) {
    return counter;
  }

  counter = val;

  if (counter < 0) {
    counter = videos.length - 1;
  }

  if (counter === videos.length) {
    counter = 0;
  }

  return counter;
}

function videoJump(videoIdxOrObj) {
  var videoIdx = videoIdxOrObj;

  if (typeof videoIdxOrObj === 'object') {
    videoIdx = videos.indexOf(videoIdxOrObj);
  }

  return videoPlay(videoIdx);
}

function videoStep(increment) {
  return videoPlay(counter + increment);
}

function videoBack() {
  return videoPlay(counter - 1);
}

function videoForward() {
  return videoPlay(counter + 1);
}

function videoPlay(videoIdx) {
  // return videosLoaded.then(function () {

    videoIdx = videoSetCounter(videoIdx, videos);

    if (videoCurrent && videoCurrent._idx === videoIdx) {
      // We're already viewing that video, silly.
      return videoIdx;
    }

    videoCurrent = videos[videoIdx];

    // var imgvideo = videoCurrent.image;
    // var imgOverlay = videoCurrent.overlay;

    main.innerHTML = (
      '<iframe src="/video.html?' + videoCurrent.url + '" allowfullscreen></iframe>\n'
    );

  // });
}

videoForward();


function onkey(e) {
  e.stopPropagation();

console.log('onkey', e);

  if (e.keyCode === 90) {
    // controls.zeroSensor();
  } else if (e.keyCode === 37) {
    videoBack();
  } else if (e.keyCode === 39) {
    videoForward();
  }

  switch (e.key) {
    case 'c':
    case 'n':
    case 'u':
      window.location.href = '/manage';
      break;
  }
}


document.addEventListener('keypress', function (e) {
  if (document.activeElement !== document.body ||
      e.alt || e.ctrlKey || e.metaKey) {

    return;
  }

  onkey(e);
});


})();
