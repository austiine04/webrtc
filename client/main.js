document.addEventListener('DOMContentLoaded', function () {

  const SERVER_IP = '10.0.2.15';
  const PORT = 5000;

  //DOM elements manipulated by the user
  var messageBox = document.querySelector('#messages');
  var callIdEntry = document.querySelector('#caller-id');
  var connectBtn = document.querySelector('#connect');
  var reciepientIdEntry = document.querySelector('#recipient-id');
  var dialBtn = document.querySelector('#dial');
  var remoteVideo = document.querySelector('#remote-video');
  var localVideo = document.querySelector('local-video');

  var callerId = null;
  var peer = null;
  var localSream = null;

  //TODO: refactor this, name p and para should be paragraph
  var makePara = function (text) {
    var p = document.createElement('p');
    p.innerText(text);
    return p;
  };

  var addMessage = function (paragraph) {
    if(messageBox.firstChild) {
      messageBox.insertBefore(paragraph, messageBox.firstChild);
    } else {
      messageBox.appendChild(paragraph);
    }
  };

  var logError = function (errorMessage) {
    var paragraph = makePara('ERROR: ' + errorMessage);
    paragraph.style.color = 'red';
    addMessage(paragraph);
  };

  var logMessage = function (text) {
    addMessage(makePara(text));
  };

  // get the local video and audio stream and show preview in the
  // "LOCAL" video element
  // successCb: has the signature successCb(stream); receives
  // the local video stream as an argument
  var getLocalStream = function (successCb) {
    if (localStream && successCb) {
      successCb(localStream);
    }
    else {
      navigator.webkitGetUserMedia(
        {
          audio: true,
          video: true
        },

        function (stream) {
          localStream = stream;

          localVideo.src = window.URL.createObjectURL(stream);

          if (successCb) {
            successCb(stream);
          }
        },

        function (err) {
          logError('failed to access local camera');
          logError(err.message);
        }
      );
    }
  };

  // set the "REMOTE" video element source
  var showRemoteStream = function (stream) {
    remoteVideo.src = window.URL.createObjectURL(stream);
  };

  // set caller ID and connect to the PeerJS server
  var connect = function () {
    callerId = callerIdEntry.value;

    if (!callerId) {
      logError('please set caller ID first');
      return;
    }

    try {
      // create connection to the ID server
      peer = new Peer(callerId, {host: SERVER_IP, port: SERVER_PORT});

      // hack to get around the fact that if a server connection cannot
      // be established, the peer and its socket property both still have
      // open === true; instead, listen to the wrapped WebSocket
      // and show an error if its readyState becomes CLOSED
      peer.socket._socket.onclose = function () {
        logError('no connection to server');
        peer = null;
      };

      // get local stream ready for incoming calls once the wrapped
      // WebSocket is open
      peer.socket._socket.onopen = function () {
        getLocalStream();
      };

      // handle events representing incoming calls
      peer.on('call', answer);
    }
    catch (e) {
      peer = null;
      logError('error while connecting to server');
    }
  };

  // make an outgoing call
  var dial = function () {
    if (!peer) {
      logError('please connect first');
      return;
    }

    if (!localStream) {
      logError('could not start call as there is no local camera');
      return
    }

    var recipientId = recipientIdEntry.value;

    if (!recipientId) {
      logError('could not start call as no recipient ID is set');
      return;
    }

    getLocalStream(function (stream) {
      logMessage('outgoing call initiated');

      var call = peer.call(recipientId, stream);

      call.on('stream', showRemoteStream);

      call.on('error', function (e) {
        logError('error with call');
        logError(e.message);
      });
    });
  };

  // answer an incoming call
  var answer = function (call) {
    if (!peer) {
      logError('cannot answer a call without a connection');
      return;
    }

    if (!localStream) {
      logError('could not answer call as there is no localStream ready');
      return;
    }

    logMessage('incoming call answered');

    call.on('stream', showRemoteStream);

    call.answer(localStream);
  };

  // wire up button events
  connectBtn.addEventListener('click', connect);
  dialBtn.addEventListener('click', dial);
});
