/*
 * Frenemy Game Server
 * -------------------
 * Run this file using nodemon for best results. Listens for events from the
 * front end and performs actions on the various objects that control the flow
 * of a game.
 */

// ------------------------------------------------------

// NPM Libraries
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Utility Libraries
var _ = require('underscore');
var Util = require('./utility');

// Frenemy Libraries
var Collection = require('./lib/collection');
var Game = require('./lib/game');
var Player = require('./lib/player');
var Message = require('./lib/message');

// Listen on port
server.listen(8080);

// Serve static files
app.use(express.static('public'));

// Resolve all paths to index
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

// ------------------------------------------------------

// Create global Object Collections
var games = Collection.create();
var players = Collection.create();
var messages = Collection.create();

/*
 * Create an instance of the Game class with no actual functionality other 
 * than messaging. This will be the default Game joined by new connections. 
 * Push the created Game object to the global Game collection.
 */
var lobby = Game.create([], { name: 'Lobby', type: 'lobby' });
games.insert(lobby);

var gameStatus = function(game) {
    console.log('--- GAMESTATUS', game);
    console.log('--- GAMEPLAYERSTATUS',game.players);

    game.players = players.selectMany(game.players).map(function(item) {
        return {
            id: item.id,
            name: item.name
        };
    });

    return game;
};

/*
 * Socket Definitions
 */
io.sockets.on('connection', function(socket) {

    // Triggered when a new socket connects
    socket.on('playerLogin', function() {

        // Create Player object
        socket.player = Player.create(socket.id);
        console.log('Event: playerLogin:\n', JSON.stringify(socket.player, null, 4));

        // Set socket pointer to lobby Game object
        socket.game = lobby;

        // Connect to the actual socket to receive events
        socket.join(socket.game.id);

        // Add newly connected Player to storage and Game
        socket.game.registerPlayer(socket.player.id);
        players.insert(socket.player);

        // Announce Player login
        io.in(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has logged in.');
        socket.emit('updateChat', 'Server', 'Welcome ' + socket.player.name + ', you have connected to Frenemy! You are currently in the Lobby.');

        // Add Player to other Player's Playerlists
        socket.broadcast.to(socket.game.id).emit('addPlayerToList', _.pick(socket.player, 'id', 'name'));

        // Send socket their Player object
        socket.emit('gameStatus', socket.game);
        socket.emit('playerStatus', socket.player);

        // Update Socket's Player & Game lists
        socket.emit('updatePlayerList', 
            players.selectMany(socket.game.players).map(function(item) {
                return {
                    id: item.id,
                    name: item.name
                };
            })
        );
        socket.emit('updateGamelist', games.map(function(item) {
            return {
                id: item.id,
                name: item.name
            };
        }));

        // Output list of Players
        console.log('Game Players:\n', players.selectMany(socket.game.players).map(function(item) { return item.name }).join(', '));
        console.log('Player Collection:\n', players.map(function(item) { return item.name }).join(', '));
    });


    // Triggered when chat message form submits
    socket.on('sendChat', function(data) {
        io.in(socket.game.id).emit('updateChat', socket.player.name, data);
        messages.insert(Message.create(socket.player.id, socket.game.id, data));
    });


    // Trigged by clicking create game
    socket.on('createGame', function() {

        // Create Game instance, push to Game Collection
        var newGame = Game.create([], { timeout: 5000 });
        games.insert(newGame);

        console.log('Event: createGame:\n', JSON.stringify(newGame, null, 4));

        // Anounce departure, unregister from current Game, update clientside, disconnect from socket room
        socket.broadcast.to(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has left the room.');
        socket.broadcast.to(socket.game.id).emit('removePlayerFromList', _.pick(socket.player, 'id', 'name'));
        socket.game.unregisterPlayer(socket.player.id);
        socket.leave(socket.game.id);

        //
        //// Socket Listen Switch ------------------------ Old Game -> New Game
        //

        // Update Socket's pointers, join Socket Room, register to Game object
        socket.game = newGame;
        socket.join(socket.game.id);
        socket.game.registerPlayer(socket.player.id);

        // Update Socket's Clientside
        socket.emit('gameStatus', socket.game);
        socket.emit('updateChat', 'Server', 'You have connected to ' + socket.game.name);

        // Persist Game object to other Socket's Clientsides
         socket.broadcast.emit('addGameToList', _.pick(socket.game, 'id', 'name'));

        // Update Socket's lists
        socket.emit('updatePlayerList', 
            players.selectMany(socket.game.players).map(function(item) {
                return {
                    id: item.id,
                    name: item.name
                };
            })
        );
        socket.emit('updateGamelist', games.map(function(item) {
            return {
                id: item.id,
                name: item.name
            };
        }));

        console.log('Game Collection:\n', games.map(function(item) { return item.name }).join(', '));

    });


    // Triggered by clicking a Game on the Gamelist
    socket.on('joinGame', function(id) {
        console.log('Event: joinGame:\n', JSON.stringify(id, null, 4));

        // Select Game object Socket wishes to join
        var selectedGame = games.select(id);

        // Check to make sure Game object exists
        if (!selectedGame) {
            return console.log('Error: Game to join not found.');
        }

        // Anounce departure, unregister from current Game, update clientside, disconnect from socket room
        socket.broadcast.to(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has left the room.');
        socket.broadcast.to(socket.game.id).emit('removePlayerFromList', _.pick(socket.player, 'id', 'name'));
        socket.game.unregisterPlayer(socket.player.id);
        socket.leave(socket.game.id);

        //
        //// Socket Listen Switch ------------------------ Old Game -> New Game
        //

        // Update Socket's pointers to selectedGame
        socket.game = selectedGame;

        // Connect to the actual Socket, announce arrival
        socket.join(socket.game.id);
        socket.emit('updateChat', 'Server', 'You have connected to ' + socket.game.name);

        // Add socket's Player object to Game Object
        socket.game.registerPlayer(socket.player.id);
        socket.broadcast.to(socket.game.id).emit('addPlayerToList', _.pick(socket.player, 'id', 'name'));

        // Announce new Player joined & update other Player's Playerlist
        socket.broadcast.to(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has joined this room');

        socket.emit('gameStatus', socket.game);

        // Update Socket's lists
        socket.emit('updatePlayerList', 
            players.selectMany(socket.game.players).map(function(item) {
                return {
                    id: item.id,
                    name: item.name
                };
            })
        );
        socket.emit('updateGamelist', games.map(function(item) {
            return {
                id: item.id,
                name: item.name
            };
        }));
    });


    socket.on('startGame', function() {
        console.log('Event: startGame:\n', JSON.stringify(socket.game.id, null, 4));

        // Announce start of Game loop, initiate Game loop
        io.in(socket.game.id).emit('updateChat', 'Server', 'The game has just started!');
        socket.game.startGame(io, games, players, messages);
    });


    // On exit of window, tab or connection in general
    socket.on('disconnect', function() {
        console.log('Event: disconnect');

        /*
         * Give five second grace period before clearing Socket's connections 
         * to Game Objects to prevent undefined errors if a Client opens and 
         * closes a window very quickly.
         */
        setTimeout(function() {
            // Remove Socket's Player from other Socket's Clientsides
            io.in(socket.game.id).emit('removePlayerFromList', _.pick(socket.player, 'id', 'name'));

            // Remove Socket's Player from current Game object
            socket.game.unregisterPlayer(socket.player.id);
            socket.game.removePlayer(socket.player.id);

            // Announce Socket's departure to other Socket's in Game
            io.in(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has disconnected');

            // Remove Socket's Player from global Game Collection
            players.delete(socket.player.id);

            console.log('Game Players:\n', players.selectMany(socket.game.players).map(function(item) { return item.name }).join(', '));
            console.log('Player Collection:\n', players.map(function(item) { return item.name }).join(', '));

            // Kill Socket's listener on Game's Socket Room
            socket.leave(socket.game.id);
        }, 5000);
    });
});
