#!/usr/bin/env node

// https://github.com/theturtle32/WebSocket-Node/wiki/How-to:-List-all-connected-sessions-&-Communicating-with-a-specific-session-only

var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({ httpServer: server });

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var connections = {};
var connectionIDCounter = 0;

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    
    // Store a reference to the connection using an incrementing ID
    connection.id = connectionIDCounter ++;
    connections[connection.id] = connection;
    
    // Now you can access the connection with connections[id] and find out
    // the id for a connection with connection.id
    
    console.log((new Date()) + ' Connection ID ' + connection.id + ' accepted.');
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected. ' +
                    "Connection ID: " + connection.id);
        
        // Make sure to remove closed connections from the global pool
        delete connections[connection.id];
    });

    connection.on('message', function(message) {
        if(message.type === 'utf8') {
            var data = message.utf8Data
            console.log((new Date()) + ' Broadcast:', data)
            broadcast(data);
        }
    });
});

// Broadcast to all open connections
function broadcast(data) {
    Object.keys(connections).forEach(function(key) {
        var connection = connections[key];
        if (connection.connected) {
            connection.send(data);
        }
    });
}

// Send a message to a connection by its connectionID
function sendToConnectionId(connectionID, data) {
    var connection = connections[connectionID];
    if (connection && connection.connected) {
        connection.send(data);
    }
}