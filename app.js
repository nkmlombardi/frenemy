var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(8080);

// routing
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});


var usernames = {};
var rooms = ['main'];

io.sockets.on('connection', function(socket) {

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function(username) {

        // store the username in the socket session for this client
        socket.username = username;

        // store the room name in the socket session for this client
        socket.room = 'main';

        // add the client's username to the global list
        usernames[username] = username;

        // send client to room 1
        socket.join('main');

        // echo to client they've connected
        socket.emit('updatechat', 'SERVER', 'you have connected to Main Lobby.');

        // echo to room 1 that a person has connected to their room
        socket.broadcast.to('main').emit('updatechat', 'SERVER', username + ' has connected to this room');
        socket.emit('updaterooms', rooms, 'main');
    });


    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function(data) {

        // we tell the client to execute 'updatechat' with 2 parameters
        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });


    socket.on('switchRoom', function(newroom) {
        console.log('EVENT: switchRoom');
        socket.leave(socket.room);
        socket.join(newroom);
        socket.emit('updatechat', 'SERVER', 'you have connected to ' + newroom);

        // sent message to OLD room
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has left this room');

        // update socket session room title
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
        socket.emit('updaterooms', rooms, newroom);
    });


    socket.on('createGame', function() {
        console.log('EVENT: createGame');

        rooms.push('game');

        socket.leave(socket.room);
        socket.join('game');
        socket.emit('updatechat', 'SERVER', 'You have initialized a game.');

        // sent message to OLD room
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has left this room');

        // update socket session room title
        socket.room = 'game';
        socket.broadcast.to('game').emit('updatechat', 'SERVER', socket.username + ' has joined this room');
        socket.emit('updaterooms', rooms, 'game');
    });


    // when the user disconnects.. perform this
    socket.on('disconnect', function() {
        // remove the username from global usernames list
        delete usernames[socket.username];

        // update list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);

        // echo globally that this client has left
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        socket.leave(socket.room);
    });
});
