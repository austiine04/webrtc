var IP = require('ip');
var PeerServer = require('peer').PeerServer;

const PORT = 5000;
var server = new PeerServer({port: PORT, allow_discovery: true});


server.on('connection', function (id) {
  console.log('new connection with id' + id);
});


server.on('disconnect', function (id) {
  console.log('disconnect with id' + id);
});

console.log('peer serving on ' + IP.address() + ':' + PORT);
