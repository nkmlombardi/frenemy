// NPM Dependencies
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Utility Libraries
var _ = require('underscore');

// Frenemy Libraries
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
var rooms = ['Lobby']; // Array of Game socket room namespaces
var games = []; // Array of Game objects
var players = []; // Array of Player objects

/*
 * Socket Definitions
 */
io.sockets.on('connection', function(socket) {

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function(username) {
        socket.player = Player.createPlayer(Util.guid(), Util.getColor(), socket.id);
        socket.game = false;
        socket.room = 'Lobby';

        // Connect to the actual socket to receive events
        socket.join(socket.room);

        // Add newly connected Player to global Player array
        players.push(socket.player);

        // Announce login of new socket & update other socket's view lists
        socket.emit('updatechat', 'Server', 'Welcome ' + socket.player.name + ' , you have connected to Frenemy! Please join a game.');
        socket.broadcast.to(socket.room).emit('updatechat', 'Server', socket.player.name + ' has logged in.');
        socket.broadcast.to(socket.room).emit('addPlayersToPlayerlist', [socket.player]);

        // Update socket's view lists
        socket.emit('updatePlayerlist', players, socket.player);
        socket.emit('updateGamelist', rooms, socket.room);
    });


    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function(data) {
        if (!socket.room) {
            socket.emit('updatechat', 'Server', 'You are not connected to a game. Chat is disabled.');
        } else {
            // socket.emit('updatechat', socket.player.name, data);
            io.in(socket.room).emit('updatechat', socket.player.name, data);
        }
    });

    socket.on('joinGame', function(id) {
        console.log('EVENT: joinGame');

        // Find Game object by it's ID from the Roomlist
        var game = Game.findGameById(games, id);

        // Remove socket Player object from lobby Playerlist
        socket.broadcast.to(socket.room).emit('removeFromPlayerlist', [socket.player]);
        players = Util.removeObject(players, socket.player);

        // Leave previous game (if exists)
        if (socket.game) { socket.game.removePlayer(socket.player); }

        // Leave previous room, disconnect from socket
        socket.broadcast.to(socket.room).emit('updatechat', 'Server', socket.player.name + ' has left the room.');
        socket.leave(socket.room);

        // Update socket's pointers
        socket.game = game;
        socket.room = game.id;

        // Connect to the actual socket, announce arrival
        socket.join(socket.room);
        socket.emit('updatechat', 'SERVER', 'you have connected to ' + socket.game.name);

        // Add socket's Player object to Game Object
        socket.game.addPlayer(socket.player);
        socket.broadcast.to(socket.room).emit('addPlayersToPlayerlist', [socket.player]);

        // Announce new Player joined & update other Player's Playerlist
        socket.broadcast.to(socket.room).emit('updatechat', 'Server', socket.player.name + ' has joined this room');
        socket.emit('updateGamelist', rooms, socket.game.id);
        socket.emit('updatePlayerlist', socket.game.players, socket.player);

        console.log(socket.game.players);
    });


    //
    socket.on('createGame', function() {
        console.log('EVENT: createGame');

        // Create game instance, push to global array
        var newGame = Game.createGame(Util.guid(), [], { name: 'Game One', timeout: 5000 }, socket);
        var newRoom = newGame.id;

        // Push newly created game onto global arrays
        rooms.push(newRoom);
        games.push(newGame);

        // Remove socket Player object from lobby Playerlist
        io.sockets.emit('removeFromPlayerlist', [socket.player]);
        players = Util.removeObject(players, socket.player);

        // Leave previous game (if exists)
        if (socket.game) { socket.game.removePlayer(socket.player); }

        // Leave previous room, disconnect from socket
        socket.broadcast.to(socket.room).emit('updatechat', 'Server', socket.player.name + ' has left the room.');
        socket.broadcast.to(socket.room).emit('addGamesToGamelist', [newRoom]);
        socket.leave(socket.room);

        // Update socket's pointers
        socket.game = newGame;
        socket.room = newRoom;

        // Connect to the actual socket, announce arrival
        socket.join(newRoom);
        socket.emit('updatechat', 'SERVER', 'you have connected to ' + socket.game.name);

        // Add Player to Game object Playerlist
        socket.game.addPlayer(socket.player);

        socket.emit('updateGamelist', rooms, socket.room);
        socket.emit('updatePlayerlist', socket.game.players, socket.player);

        console.log(socket.game.players);
    });


    socket.on('startGame', function() {
        console.log('EVENT: startGame');
        console.log(socket.room);

        socket.game.startGame();
        io.in(socket.room).emit('updatechat', 'Server', 'The game has just started!');
    });


    // On exit of window, tab or connection in general
    socket.on('disconnect', function() {
        // Update other socket's Playerlist, globally
        io.sockets.emit('removeFromPlayerlist', [socket.player]);

        // Remove Player from current Game & global Player array
        if (socket.game) { socket.game.removePlayer(socket.player); }
        players = Util.removeObject(players, socket.player);

        // Announce to room socket's departure
        io.in(socket.room).emit('updatechat', 'Server', socket.player.name + ' has disconnected');

        // Disconnect from Game socket
        if (socket.game) { socket.leave(socket.game); }
    });
});
