// NPM Dependencies
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Frenemy Lib
var Game = require('./lib/game');

// Listen on port
server.listen(8080);

// Routing
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});


/*
 * Global Variables
 */
var usernames = {};
var rooms = ['main'];
var games = [];

/*
 * Socket Definitions
 */
io.sockets.on('connection', function(socket) {

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function(username) {

        // store the username in the socket session for this client
        socket.username = username;

        // store the room name in the socket session for this client
        socket.room = 'main';
        socket.game = false;

        // add the client's username to the global list
        usernames[username] = username;

        // send client to room 1
        socket.join('main');

        // echo to client they've connected
        socket.emit('updatechat', 'Server', 'You have connected to Main Lobby.');

        // echo to room 1 that a person has connected to their room
        socket.broadcast.to('main').emit('updatechat', 'Server', username + ' has connected to this room');
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
        socket.broadcast.to(socket.room).emit('updatechat', 'Server', socket.username + ' has left this room');

        // update socket session room title
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('updatechat', 'Server', socket.username + ' has joined this room');
        socket.emit('updaterooms', rooms, newroom);
    });


    // Not currently using function argument
    socket.on('createGame', function(owner) {
        console.log('EVENT: createGame');

        // Create game instance, push to global array
        socket.game = Game.createGame('GAME_ID', [], { timeout: 5000 }, socket);
        var game = socket.game;

        games.push(game);
        rooms.push(game.id);

        socket.leave(socket.room);
        socket.join(game.id);
        socket.emit('updatechat', 'Server', 'You have initialized a game.');

        // sent message to OLD room
        socket.broadcast.to(socket.room).emit('updatechat', 'Server', socket.username + ' has left this room');

        // update socket session room title
        socket.room = game.id;
        socket.broadcast.to(game.id).emit('updatechat', 'Server', socket.username + ' has joined this room');
        socket.emit('updaterooms', rooms, game.id);
    });


    socket.on('startGame', function() {
        console.log('EVENT: startGame');

        console.log(socket.room);

        var game = socket.game;

        game.startGame();

        socket.emit('updatechat', 'Server', socket.username + ' has just started the game!');

    });


    // when the user disconnects.. perform this
    socket.on('disconnect', function() {
        // remove the username from global usernames list
        delete usernames[socket.username];

        // update list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);

        // echo globally that this client has left
        socket.broadcast.emit('updatechat', 'Server', socket.username + ' has disconnected');
        socket.leave(socket.room);
    });
});
