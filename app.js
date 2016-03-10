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

    /**
     * Handle a new connection to the Frenemy server. Player provides no input
     * as they are assigned an ID and name.
     */
    socket.on('playerLogin', function() {

        // Create, register, and persist Player object
        socket.player = Player.create(socket.id);
        socket.emit('updatePlayer', socket.player);

        // Join Lobby, add Player to Lobby
        socket.game = lobby;
        socket.join(socket.game.id);
        socket.emit('updateGame', socket.game.status());
        socket.game.addPlayer(socket.player.id);
        socket.emit('updateGamelist', Database.games.listifyAll());

        // Notify Players in Game of new Player connection
        socket.game.addMessage(Message.create({
            gameID: socket.game.id,
            senderID: 0,
            type: 'OTHERS',
            content: 'Player ' + socket.player.name + ' has logged in'
        }), socket);

        //
        socket.game.addMessage(Message.create({
            gameID: socket.game.id,
            senderID: socket.player.id,
            type: 'SELF',
            content: 'Welcome ' + socket.player.name + ', you have connected to ' +
            'Frenemy! The game is currently in Alpha stages so you may encounter ' +
            'some unpleasant bugs. Thank you for participating! You are currently ' +
            'in the Lobby.'
        }), socket);
    });


    /**
     * Handle new messages receieved from client side. All success, failure event
     * emmittance is handled by the Game object.
     * @param {string}     content
     * @param {string}     target
     */
    socket.on('sendChat', function(content, target) {
        // Flood control limiter
        if (socket.chatFloodControl) {
            socket.game.addMessage(Message.create({
                gameID: socket.game.id,
                senderID: 0,
                type: 'SELF',
                content: 'You were voted out and therefore lost your ability to send messages.'
            }), socket);
        }

        // Player kicked limiter
        if (socket.game.current.state === socket.game.states.playing) {
            if (socket.game.current.players.has(socket.player.id)) {
                socket.game.addMessage(Message.create({
                    gameID: socket.game.id,
                    senderID: 0,
                    type: 'SELF',
                    content: 'You were voted out and therefore lost your ability to send messages.'
                }), socket);
                return console.log('Player lost and tried to send a message.');
            }
        }

        // Handle private messages
        if (target !== undefined && socket.game.current.state == socket.game.states.playing) {
            socket.game.addMessage(Message.create({
                gameID: socket.game.id,
                senderID: socket.player.id,
                recipientID: target,
                type: 'PRIVATE',
                content: content
            }), socket);

        // Handle public messages
        } else {
            socket.game.addMessage(Message.create({
                gameID: socket.game.id,
                senderID: socket.player.id,
                type: 'PUBLIC',
                content: content
            }), socket);
        }

        // Set flood control limiter
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
        console.log(socket.player.name + ' has voted for ' + Database.players.get(target));

        if (socket.game.current.state !== socket.game.states.playing) {
            socket.emit('updateChat', 'Server', 'The game has not started, you cannot submit votes.');
            return console.log('Vote receieved for game that has not started');
        }

        if (!socket.game.current.players.has(socket.player.id)) {
            socket.emit('updateChat', 'Server', 'You lost and can no longer submit votes to this game.');
            return console.log('Player lost and tried to vote.');
        }

        var result = socket.game.current.round.ballot.createVote(socket.player.id, target);
        if (result) { return socket.emit('voteStatus', target); }

        return console.log('No vote was created!?');
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
