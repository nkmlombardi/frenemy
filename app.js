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

// Global Variables
var Database = require('./database');
global.io = io;

// Frenemy Libraries
var Game = require('./models/game');
var Player = require('./models/player');
var Message = require('./models/message');

// Listen on port
server.listen(8080);

// Serve static files
app.use(express.static('public'));

// Resolve all paths to index
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});


// ------------------------------------------------------

/*
 * Create an instance of the Game class with no actual functionality other
 * than messaging. This will be the default Game joined by new connections.
 * Push the created Game object to the global Game collection.
 */
var lobby = Game.create({ name: 'Lobby' });


/*
 * Socket Definitions
 */
io.sockets.on('connection', function(socket) {

    // Triggered when a new socket connects
    socket.on('playerLogin', function() {

        // Create, register, and persist Player object
        socket.player = Player.create(socket.id);
        socket.emit('playerStatus', socket.player);

        // Join Lobby, add Player to Lobby
        socket.game = lobby;
        socket.join(socket.game.id);
        socket.game.addPlayer(socket.player.id);
        socket.emit('gameStatus', socket.game);

        // Announce Player login
        io.in(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has logged in.');
        socket.emit('updateChat', 'Server', 'Welcome ' + socket.player.name + ', you have connected to Frenemy! The game is currently in Alpha stages so you may encounter some unpleasant bugs. Thank you for participating! You are currently in the Lobby.');

        // Update Socket's Player & Game lists
        socket.emit('updatePlayerList', Database.players.listifyMany(socket.game.players));
        socket.emit('updateGameList', Database.games.listifyAll());
    });


    // Triggered when chat message form submits
    socket.on('sendChat', function(data, target) {
        if (socket.chatFloodControl) { return socket.emit('updateChat', 'Server', 'Pump the brakes there chief...'); }

        if (socket.game.current.state === socket.game.states.playing) {
            if (socket.game.current.players.has(socket.player.id)) {
                socket.emit('updateChat', 'Server', 'You were voted out and therefore lost your ability to send messages.');
                return console.log('Player lost and tried to send a message.');
            }
        }

        if (target !== undefined && socket.game.current.state == socket.game.states.playing) {
            var player = Database.players.get(target);

            // Update target's chat
            socket.broadcast.to(player.socketID).emit('updateChat', 'Whisper from ' + socket.player.name + ': ', data);
            Message.create(socket.player.id, socket.game.id, 'Whisper From ' + socket.player.name + ': ', data);

            // Update sender's chat
            Message.create(socket.player.id, socket.game.id, 'Whisper to ' + player.name + ': ', data);
            socket.emit('updateChat', 'Whisper to ' + player.name + ': ', data);

        } else {
            Message.create(socket.player.id, socket.game.id, data);
            io.in(socket.game.id).emit('updateChat', socket.player.name, data);
        }

        socket.chatFloodControl = true;
        setTimeout(function() {
            socket.chatFloodControl = false;
        }, 3000);
    });


    // Trigged by clicking create game
    socket.on('createGame', function() {

        // Create, register, and persist new Game object
        var newGame = Game.create({ timeout: 10000 });

        // Anounce departure, unregister from current Game, update clientside, disconnect from socket room
        socket.broadcast.to(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has left the room.');
        socket.game.removePlayer(socket.player.id);
        socket.leave(socket.game.id);

        //
        //// Socket Listen Switch ------------------------ Old Game -> New Game
        //

        // Update Socket's pointers, join Socket Room, register to Game object
        socket.game = newGame;
        socket.join(socket.game.id);
        socket.game.addPlayer(socket.player.id);

        // Update Socket's Clientside
        socket.emit('gameStatus', socket.game);
        socket.emit('updateChat', 'Server', 'You have connected to ' + socket.game.name);
        socket.broadcast.to(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has joined this room');

        // Update Socket's lists
        socket.emit('updatePlayerList', Database.players.listifyMany(socket.game.players));
        socket.emit('updateGameList', Database.games.listifyAll());
    });


    // Triggered by clicking a Game on the Gamelist
    socket.on('joinGame', function(gameID) {

        // Select Game object Socket wishes to join
        var selectedGame = Database.games.get(gameID);

        // Check to make sure Game object exists
        if (!selectedGame) { return console.log('Error: Game to join not found.'); }

        if (selectedGame.current.state === selectedGame.states.started) {
            return socket.emit('updateChat', 'Server', 'That game has already started and cannot be joined.');
        }

        // Anounce departure, unregister from current Game, update clientside, disconnect from socket room
        socket.broadcast.to(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has left the room.');
        socket.game.removePlayer(socket.player.id);
        socket.leave(socket.game.id);

        //
        //// Socket Listen Switch ------------------------ Old Game -> New Game
        //

        // Update Socket's pointers, join Socket Room, register to Game object
        socket.game = selectedGame;
        socket.join(socket.game.id);
        socket.game.addPlayer(socket.player.id);

        // Update Socket's Clientside
        socket.emit('gameStatus', socket.game);
        socket.emit('updateChat', 'Server', 'You have connected to ' + socket.game.name);
        socket.broadcast.to(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has joined this room');

        // Update Socket's lists
        socket.emit('updatePlayerList', Database.players.listifyMany(socket.game.players));
        socket.emit('updateGameList', Database.games.listifyAll());
    });


    socket.on('startGame', function() {
        io.in(socket.game.id).emit('updateChat', 'Server', 'The game has just started!');
        socket.game.start();
    });


    socket.on('sendVote', function(target) {
        if (socket.game.current.state != socket.game.states.playing) {
            socket.emit('updateChat', 'Server', 'The game has not started, you cannot submit votes.');
            return console.log('Vote receieved for game that has not started');
        }

        if (socket.game.current.players.has(socket.player.id)) {
            socket.emit('updateChat', 'Server', 'You lost and can no longer submit votes to this game.');
            return console.log('Player lost and tried to vote.');
        }

        var result = socket.game.current.round.ballot.createVote(socket.player.id, target);
        if (result) { socket.emit('voteStatus', target); }
    });


    /*
     * On exit of window, tab or connection in general
     * 
     * Give a grace period before clearing Socket's connections
     * to Game Objects to prevent undefined errors if a Client opens and
     * closes a window very quickly.
     */
    socket.on('disconnect', function() {
        setTimeout(function() {
            // Remove Socket's Player from current Game object
            socket.game.removePlayer(socket.player.id);

            // Announce Socket's departure to other Socket's in Game
            io.in(socket.game.id).emit('updateChat', 'Server', socket.player.name + ' has disconnected');

            // Remove Socket's Player from global Game Collection
            Database.players.delete(socket.player.id);

            // Kill Socket's listener on Game's Socket Room
            socket.leave(socket.game.id);
        }, 1500)
    });
});
