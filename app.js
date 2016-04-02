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
//Logger gets set later so that the gameID can be passed
var Logger = require('./helpers/log');


// Listen on port
server.listen(8080);

// Serve static files
app.use(express.static('ui/web'));

// Resolve all paths to index
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/ui/web/index.html');
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

        console.log('New Player Connected!');

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
            content: 'Player ' + socket.player.name + ' has logged in.'
        }), socket);

        // Send introduction message to Client
        socket.game.addMessage(Message.create({
            gameID: socket.game.id,
            senderID: 0,
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
                content: 'Chill out and stop sending messages so fast. You\' be fine.. probably.'
            }), socket);
            return;
        }

        // Player kicked limiter
        if (socket.game.current.state === socket.game.states.playing) {
            if (!socket.game.current.players.has(socket.player.id)) {
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
        // && socket.game.current.state == socket.game.states.playing
        if (target !== undefined) {
            if (socket.player.id !== 0){
                logger.log('info', Database.players.listify(socket.player.id).name + ' sent a message to ' + Database.players.listify(target).name, socket.game.id);
            }
            console.log('Private Message (' + target + '): ', content);
            socket.game.addMessage(Message.create({
                gameID: socket.game.id,
                senderID: socket.player.id,
                recipientID: target,
                type: 'PRIVATE',
                content: content
            }), socket);

        // Handle public messages
        } else {
            if (socket.player.id !== 0){
                logger.log('info', Database.players.listify(socket.player.id).name + ' sent a public message', socket.game.id);
            }
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
        var newGame = Game.create({ timeout: 100000 });
        // Set the logger up with gameID
        var logger = Logger(newGame.id);

        // Notify other Player's of Client's departure
        socket.game.addMessage(Message.create({
            gameID: socket.game.id,
            senderID: 0,
            type: 'OTHERS',
            content: 'Player ' + socket.player.name + ' has left the game.'
        }), socket);

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
        socket.emit('updateGame', socket.game.status());
        socket.game.addMessage(Message.create({
            gameID: socket.game.id,
            senderID: 0,
            type: 'SELF',
            content: 'You have connected to ' + socket.game.name
        }), socket);
    });


    // Triggered by clicking a Game on the Gamelist
    socket.on('joinGame', function(gameID) {

        // Select Game object Socket wishes to join
        var selectedGame = Database.games.get(gameID);

        // Check to make sure Game object exists
        if (!selectedGame) { return console.log('Error: Game to join not found.'); }

        if (selectedGame.current.state === selectedGame.states.started) {
            return socket.game.addMessage(Message.create({
                gameID: socket.game.id,
                senderID: 0,
                type: 'SELF',
                content: 'Cannot join, game currently in progress.'
            }), socket);
        }

        // Notify other Player's of Client's departure
        socket.game.addMessage(Message.create({
            gameID: socket.game.id,
            senderID: 0,
            type: 'OTHERS',
            content: 'Player ' + socket.player.name + ' has left the game.'
        }), socket);

        // Remove Player from current Game
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
        socket.emit('updateGame', socket.game.status());
        socket.game.addMessage(Message.create({
            gameID: socket.game.id,
            senderID: 0,
            type: 'SELF',
            content: 'You have connected to ' + socket.game.name
        }), socket);

        // Notify other Player's of Client's arrival
        socket.game.addMessage(Message.create({
            gameID: socket.game.id,
            senderID: 0,
            type: 'OTHERS',
            content: 'Player ' + socket.player.name + ' has joined the game.'
        }), socket);
    });


    socket.on('startGame', function() {
        // Notify other Player's of Client's arrival
        socket.game.addMessage(Message.create({
            gameID: socket.game.id,
            senderID: 0,
            type: 'PUBLIC',
            content: 'The game has been started...'
        }), socket);

        setTimeout(function() {
            socket.game.addMessage(Message.create({
                gameID: socket.game.id,
                senderID: 0,
                type: 'PUBLIC',
                content: '3...'
            }), socket);
        }, 1000);

        setTimeout(function() {
            socket.game.addMessage(Message.create({
                gameID: socket.game.id,
                senderID: 0,
                type: 'PUBLIC',
                content: '2...'
            }), socket);
        }, 2000);

        setTimeout(function() {
            socket.game.addMessage(Message.create({
                gameID: socket.game.id,
                senderID: 0,
                type: 'PUBLIC',
                content: '1...'
            }), socket);
        }, 3000);

        setTimeout(function() {
            socket.game.start();
        }, 4000);
    });


    socket.on('addVote', function(target) {
        console.log(socket.player.name + ' has voted for ' + Database.players.get(target).name);
        logger.log('info', socket.player.name + ' has voted for ' + Database.players.get(target).name);

        if (socket.game.current.state !== socket.game.states.playing) {
            socket.game.addMessage(Message.create({
                gameID: socket.game.id,
                senderID: 0,
                type: 'SELF',
                content: 'The game has not started, you cannot submit votes.'
            }), socket);
            return console.log('Vote receieved for game that has not started');
        }

        if (!socket.game.current.players.has(socket.player.id)) {
            socket.game.addMessage(Message.create({
                gameID: socket.game.id,
                senderID: 0,
                type: 'SELF',
                content: 'You lost and can no longer submit votes to this game.'
            }), socket);
            return console.log('Player lost and tried to vote.');
        }

        var result = socket.game.current.round.ballot.addVote(socket.player.id, target);
        if (result) { return socket.emit('updateVote', target); }

        return console.log('No vote was created!?');
    });


    socket.on('removeVote', function(target) {
        console.log(socket.player.name + ' has removed a vote for ' + Database.players.get(target));

        if (socket.game.current.state !== socket.game.states.playing) {
            socket.game.addMessage(Message.create({
                gameID: socket.game.id,
                senderID: 0,
                type: 'SELF',
                content: 'The game has not started, you cannot submit votes.'
            }), socket);
            return console.log('Vote receieved for game that has not started');
        }

        if (!socket.game.current.players.has(socket.player.id)) {
            socket.game.addMessage(Message.create({
                gameID: socket.game.id,
                senderID: 0,
                type: 'SELF',
                content: 'You lost and can no longer submit votes to this game.'
            }), socket);
            return console.log('Player lost and tried to vote.');
        }

        var result = socket.game.current.round.ballot.removeVote(socket.player.id, target);
        if (result) { return socket.emit('updateVote', target); }

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
            if (socket.game) {
                socket.game.removePlayer(socket.player.id);

                // Notify Players in Game of new Client's departure
                socket.game.addMessage(Message.create({
                    gameID: socket.game.id,
                    senderID: 0,
                    type: 'OTHERS',
                    content: 'Player ' + socket.player.name + ' has logged out.'
                }), socket);

                // Kill Socket's listener on Game's Socket Room
                socket.leave(socket.game.id);
            }

            if (socket.player) {
                // Remove Socket's Player from global Game Collection
                // Database.players.delete(socket.player.id);
            }
        }, 2500)
    });
});
