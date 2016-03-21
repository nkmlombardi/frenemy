angular.module('app.services', [])

.factory('socket', function(socketFactory) {
    // Create socket and connect to http://chat.socket.io 
    var myIoSocket = io.connect('http://localhost:8080');

    mySocket = socketFactory({
        ioSocket: myIoSocket
    });

    return mySocket;
});
