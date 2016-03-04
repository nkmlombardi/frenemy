/*
 * Frenemy Game Server
 * -------------------
 * Run this file using nodemon for best results. Listens for events from the
 * front end and performs actions on the various objects that control the flow
 * of a game.
 */

// ------------------------------------------------------

// Dependencies
//// NPM Libraries
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

//// Utility Libraries
var _ = require('underscore');

//// Frenemy Libraries
var Util = require('./utility');
var Collection = require('./lib/collection');
var Game = require('./lib/game');
var Player = require('./lib/player');
var Message = require('./lib/message');

// Listen on port
server.listen(8080);

// Routing
//// Serve static files
app.use(express.static('public'));

//// Resolve all paths to index
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

// ------------------------------------------------------

// Global Objects
//// An instance of the Game class with no actual functionality other than messaging
var lobby = Game.createLobby(Util.guid(), [], { name: 'Lobby', type: 'lobby' });

//// This is the gamelist, it contains all of the Game objects
// var games = [lobby];
// var messages = [];

// Create Game object containers
var games = Collection.create();
var players = Collection.create();
var messages = Collection.create();

games.insert(lobby);



/*
 * Socket Definitions
 */
io.sockets.on('connection', function(socket) {

    // Triggered when a new socket connects
    socket.on('playerLogin', function() {
        console.log('Event: playerLogin');

        // Create Player object
        socket.player = Player.create(socket.id);

        // Set socket pointer to lobby Game object
        socket.game = lobby;

        // Connect to the actual socket to receive events
        socket.join(socket.game.id);

        // Add newly connected Player to global Player array
        socket.game.registerPlayer(socket.player);
        players.insert(socket.player);

        // Announce Player login
        io.in(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has logged in.');
        socket.emit('updateChat', 'Server', 'Welcome ' + socket.player.name + ' , you have connected to Frenemy! You are currently in the Lobby.');

        // Add Player to other Player's Playerlists
        socket.broadcast.to(socket.game.id).emit('addPlayersToList', [socket.player]);

        // Send socket their Player object
        socket.emit('playerStatus', {
            player: socket.player,
            game: socket.game
        });

        // Update socket's Player & Game lists
        socket.emit('updatePlayerList', socket.game.players);
        socket.emit('updateGamelist', games.listify());
    });


    // Triggered when chat message form submits
    socket.on('sendChat', function(data) {
        io.in(socket.game.id).emit('updateChat', socket.player.name, data);

        // Log the message in memory
        messages.push({
            timestamp: new Date(),
            player: socket.player.name,
            content: data
        });

        messageStore.insert(Message.create(socket.player.id, data));
    });

    // Triggered by clicking a Game on the Gamelist
    socket.on('joinGame', function(id) {
        console.log('Event: joinGame', id);

        // Find Game object by it's ID from the Roomlist
        // var selectedGame = Game.findGameById(games, id);

        var selectedGame = games.select(id);
        if (selectedGame) {

            // Leave previous Game, notify other Players, disconnect from Socket
            socket.broadcast.to(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has left the room.');

            var newPlayerList = socket.game.unregisterPlayer(socket.player);
            socket.broadcast.to(socket.game.id).emit('updatePlayerList', newPlayerList);

            // Instead of broadcasting who to remove, let's just send them all
            // socket.broadcast.to(socket.game.id).emit('removePlayersFromList', [socket.player]);
            socket.leave(socket.game.id);

            // Update Socket's pointers to selectedGame
            socket.game = selectedGame;

            // Connect to the actual Socket, announce arrival
            socket.join(socket.game.id);
            socket.emit('updateChat', 'Server', 'You have connected to ' + socket.game.name);

            // Add socket's Player object to Game Object
            socket.game.registerPlayer(socket.player);
            socket.broadcast.to(socket.game.id).emit('addPlayersToList', [socket.player]);

            // Announce new Player joined & update other Player's Playerlist
            socket.broadcast.to(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has joined this room');

            socket.emit('playerStatus', {
                game: socket.game
            });

            // Update Socket's lists
            socket.emit('updateGamelist', games.listify());
            socket.emit('updatePlayerList', socket.game.players);
        } else {
            console.log('Error: Game to join not found.');
        }
    });


    // Trigged by clicking create game
    socket.on('createGame', function() {
        console.log('Event: createGame');

        // Create game instance, push to global array
        var newGame = Game.createGame(Util.guid(), [], { timeout: 5000 }, io);

        // Push newly created game onto global Gamelist
        // games.push(newGame);
        games.insert(newGame);

        // Leave previous Game, notify other Players, disconnect from Socket
        socket.broadcast.to(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has left the room.');

        // socket.game.unregisterPlayer(socket.player);
        // socket.game.removePlayer(socket.player);
        // socket.broadcast.to(socket.game.id).emit('removePlayersFromList', [socket.player]);

        var newPlayerList = socket.game.unregisterPlayer(socket.player);
        socket.broadcast.to(socket.game.id).emit('updatePlayerList', newPlayerList);


        socket.leave(socket.game.id);

        // Update socket's pointers
        socket.game = newGame;

        // Connect to the actual socket, announce arrival
        socket.join(socket.game.id);
        socket.emit('updateChat', 'Server', 'You have connected to ' + socket.game.name);

        // Add Player to Game object Playerlist & send socket their Player object
        socket.game.registerPlayer(socket.player);

        socket.emit('playerStatus', {
            game: socket.game
        });

        // Tell everyone else about the new game
        socket.broadcast.emit('addGamesToList', [socket.game]);

        // Update Socket's lists
        socket.emit('updateGamelist', games.listify());
        socket.emit('updatePlayerList', socket.game.players);
    });


    socket.on('startGame', function() {
        console.log('Event: startGame');

        io.in(socket.game.id).emit('updateChat', 'Server', 'The game has just started!');
        socket.game.startGame(io);
    });


    // On exit of window, tab or connection in general
    socket.on('disconnect', function() {
        // Update other socket's Playerlist, globally
        if (socket.game) {
            io.in(socket.game.id).emit('removePlayersFromList', [socket.player]);

            // Remove Player from current Game
            socket.game.unregisterPlayer(socket.player);
            socket.game.removePlayer(socket.player);

            // Announce to room socket's departure
            io.in(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has disconnected');

            // Disconnect from Game socket
            socket.leave(socket.game);
        }
    });
});
