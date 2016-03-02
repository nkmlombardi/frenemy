// NPM Dependencies
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Frenemy Lib
var Util = require('./utility');
var Game = require('./lib/game');
var Player = require('./lib/player');

// Listen on port
server.listen(8080);

// Routing
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});


/*
 * Global Variables
 */
var rooms = [];         // Array of Game socket room namespaces
var games = [];         // Array of Game objects
var players = [];       // Array of Player objects

/*
 * Socket Definitions
 */
io.sockets.on('connection', function(socket) {

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function(username) {
        socket.player = Player.createPlayer(Util.guid(), Util.getColor());
        socket.game = false;
        socket.room = false;

        // echo to client they've connected
        socket.emit('updatechat', 'Server', 'Welcome ' + socket.player.name + ' , you have connected to Frenemy! Please join a game.');

        // Update available rooms
        socket.emit('updaterooms', rooms, socket.room);
    });


    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function(data) {
        if (!socket.room) {
            socket.emit('updatechat', 'Server', 'You are not connected to a game. Chat is disabled.');
        } else {
            socket.emit('updatechat', socket.player.name, data);
        }
    });

    socket.on('joinGame', function(id) {
        console.log('EVENT: joinGame');

        var game = Game.findGameById(games, id);

        socket.leave(socket.game);
        socket.join(game.id);

        socket.emit('updatechat', 'SERVER', 'you have connected to ' + game.id);
        socket.game = game;
        socket.room = game.id;

        socket.game.addPlayer(socket.player);

        socket.broadcast.to(socket.game.id).emit('updatechat', 'Server', socket.player.name + ' has joined this room');
        socket.emit('updaterooms', rooms, socket.game.id);
    });


    // 
    socket.on('createGame', function() {
        console.log('EVENT: createGame');

        // Create game instance, push to global array
        var newGame = Game.createGame(Util.guid(), [socket.player], { name: 'Game One', timeout: 5000 }, socket);

        // Push newly created game onto global arrays
        rooms.push(newGame.id);
        games.push(newGame);

        // Leave old room, join new one
        socket.leave(socket.game.id);
        socket.join(newGame.id);

        // Assign socket's game and room variables
        socket.game = newGame;
        socket.room = newGame.id;


        socket.emit('updatechat', 'Server', 'You have initialized a game with Name/ID: ' + newGame.id);
        socket.broadcast.to(socket.room).emit('updatechat', 'Server', socket.player.id + ' has joined this game.');
        
        socket.emit('updaterooms', rooms, socket.room);
    });


    socket.on('startGame', function() {
        console.log('EVENT: startGame');
        console.log(socket.room);

        socket.game.startGame();
        socket.emit('updatechat', 'Server', socket.player.name + ' has just started the game!');
    });


    // when the user disconnects.. perform this
    socket.on('disconnect', function() {
        // remove the username from global usernames list
        delete players[socket.player];

        // update list of users in chat, client-side
        io.sockets.emit('updateusers', players);

        // echo globally that this client has left
        // socket.broadcast.emit('updatechat', 'Server', socket.player.name + ' has disconnected');
        socket.leave(socket.game);
    });
});
