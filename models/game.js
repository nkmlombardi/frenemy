// Libraries
var utility = require('../helpers/utility');
var Database = require('../database');
var Round = require('./round');
var Message = require('./message');
var _ = require('underscore');
//Logger gets set later so that the gameID can be passed
var logger;


// Data Structures
var Set = require("collections/set");
var SortedArraySet = require("collections/sorted-array-set");

// Constructors
exports.create = function(options) {
    var game = new Game(options);
    Database.games.set(game.id, game);
    global.io.emit('addGame', { id: game.id, name: game.name });

    return game;
};

// Class
function Game(options) {
    // Properties set on initialization of object
    this.id = utility.guid();
    this.name = options.name || this.id;
    this.created = new Date();
    this.timeout = options.timeout || 120000;
    this.players = new Set();

    this.messages = [];

    this.winners = [];
    this.losers = [];

    // States a Game object can be in
    this.states = Object.freeze({
        created: 'CREATED',
        playing: 'PLAYING',
        completed: 'COMPLETED'
    });

    // Properties determined by the state of the game
    this.current = {
        state: this.states.created,
        players: new Set(),
        rounds: [],
        round: false
    };
    
    //Setting gameID
    logger = require('../helpers/log')(this.id);
};

Game.prototype.status = function(playerID) {
    return {
        id: this.id,
        name: this.name,
        players: Database.players.listifyMany(this.players),
        states: this.states,
        messages: Database.messages.getMany(this.messages).filter(function(message) {
            if (message.type === 'PUBLIC' || message.recipientID === playerID || message.senderID === playerID) {
                return message.persist();
            }
        }),
        current: {
            state: this.current.state,
            players: Database.players.listifyMany(this.current.players)
        },
        winners: Database.players.listifyMany(this.winners),
        losers: Database.players.listifyMany(this.losers)
    };
}

/**
 * Detects the current state of the game, and adds a specified ID to the
 * PlayerList depending on that state.
 * @param {object}     message
 */
Game.prototype.addMessage = function(message, socket) {
    if (message.type === message.types.public) {
        global.io.in(this.id).emit('addMessage', message.persist());
        return this.messages.push(message.id);

    } else if (message.type === message.types.private) {
        var recipient = Database.players.get(message.recipientID);

        socket.emit('addMessage', message.persist());
        socket.broadcast.to(recipient.socketID).emit('addMessage', message.persist());
        return this.messages.push(message.id);

    } else if (message.type === message.types.self) {
        socket.emit('addMessage', message.persist());
        return this.messages.push(message.id);

    } else if (message.type === message.types.others) {
        socket.broadcast.to(this.id).emit('addMessage', message.persist());
        return this.messages.push(message.id);
    }

    console.log('Invalid Message.type, cannot send message.');
    return false;
};

/*
    Detects the current state of the game, and adds a specified ID to the
    PlayerList depending on that state.
 */
Game.prototype.addPlayer = function(playerID) {
    if (this.current.state === this.states.created) {
        global.io.in(this.id).emit('addPlayer', Database.players.listify(playerID));
        return this.players.add(playerID);

    } else if (this.current.state === this.states.playing) {
        console.error('Game.addPlayer() was called on a game that has already started.');
        return false;

    } else {
        console.error('Game.addPlayer() was called on a game that has ended.');
        return false;
    }
};

/*
    Detects the current state of the game, and removes specified ID from either
    list depending on that state.
 */
Game.prototype.removePlayer = function(playerID) {
    if (this.current.state === this.states.created) {
        global.io.in(this.id).emit('removePlayer', Database.players.listify(playerID));

        return this.players.delete(playerID);

    } else if (this.current.state === this.states.playing) {
        console.log('Event: removePlayer(' + playerID + ') | this.current.state = ' + this.current.state);

        this.losers.push(playerID);
        global.io.in(this.id).emit('removePlayer', Database.players.listify(playerID));

        return this.current.players.delete(playerID);

    } else {
        console.error('Game.removePlayer() was called on a game that has ended.');
        return false;
    }
};


/*
    Initiator Methods
 */
Game.prototype.start = function() {
    // Check to see if Game object is actually a Lobby, and not a real Game
    if (this.timeout === 0) {
        return console.log('Attempt was made to start a lobby Game instance.');
    }

    // Initialize game state variables
    this.current.state = this.states.playing;
    this.current.players = this.players.clone();
    this.messages = [];

    // Update Player's Game object before gameLoop
    global.io.in(this.id).emit('updateGameState', this.current.state);
    global.io.in(this.id).emit('updateGamePlayers', Database.players.listifyMany(this.current.players));
    global.io.in(this.id).emit('updateGameMessages', this.messages);

    /*
     * On defined interval, end previous round and create new round. The bind
     * function is in place to allow use of this object inside of the function.
     * The function is getting called once at the beginning so the round begins
     * immediately.
     */
    var gameLoop = _.bind(function() {
        // If this isn't the first round, close previous round
        if (this.current.rounds.length != 0) {
            this.addMessage(Message.create({
                gameID: this.id,
                senderID: 0,
                type: 'PUBLIC',
                content: 'The round has ended.'
            }), global.io);

            // Conclude Round, determine losers
            var voted = this.current.round.end();

            console.log('Receieved ' + voted.length + ' votes this round');
            console.log('Voted object: ', voted);

            // Determine if voted players tied for win
            if (this.current.players.length === voted.length) {
                var players = Database.players.listifyMany(voted).map(function(player) {
                    return player.name;
                });

                this.addMessage(Message.create({
                    gameID: this.id,
                    senderID: 0,
                    type: 'PUBLIC',
                    content: 'The following players have won the game: ' + players.join(', ')
                }), global.io);

                // Victory cleanup logic
                this.winners = voted;
                this.current.state = this.states.completed;

                global.io.in(this.id).emit('updateGameState', this.current.state);
                global.io.in(this.id).emit('updateGameWinners', Database.players.listifyMany(this.winners));
                logger.close();

                return clearInterval(loopInterval);
            }

            // If no votes were submitted, remove random Player
            if (voted.length === 0) {
                var player = Database.players.listify(this.current.players.one());

                this.addMessage(Message.create({
                    gameID: this.id,
                    senderID: 0,
                    type: 'PUBLIC',
                    content: 'No votes received, random player lost: ' + player.name
                }), global.io);
                
                logger.log('info', 'Nobody voted, so we removed ' + player.name);

                this.removePlayer(player.id);

                // Otherwise remove all Players tied for most votes
            } else {
                var players = Database.players.listifyMany(voted).map(function(player) {
                    return player.name;
                });

                this.addMessage(Message.create({
                    gameID: this.id,
                    senderID: 0,
                    type: 'PUBLIC',
                    content: 'The following players have lost: ' + players.join(', ')
                }), global.io);
                
                logger.log('info', players.join(', ') + ' was/were voted off');

                // Remove each loser
                voted.forEach(function(playerID) {
                    this.removePlayer(playerID);
                }, this);
            }

            // Check if one Player remains after loser are removed
            if (this.current.players.length === 1) {
                // Game integrity checks
                if ((this.current.players.length + this.losers.length) != this.players.length) {
                    console.log('Error: Winners + Losers count does not equal original PlayerList length when game was started.');
                }

                if (this.current.rounds.length > this.players.length) {
                    console.log('Error: There were more rounds than Players in the game.');
                }

                var winner = Database.players.get(this.current.players.only());
                this.addMessage(Message.create({
                    gameID: this.id,
                    senderID: 0,
                    type: 'PUBLIC',
                    content: 'The following player has won the game: ' + winner.name
                }), global.io);
                
                logger.log('info', winner.name + ' won');

                // Victory cleanup logic
                this.winners.push(winner.id);
                this.current.state = this.states.completed;

                global.io.in(this.id).emit('updateGameState', this.current.state);
                global.io.in(this.id).emit('updateGameWinners', Database.players.listifyMany(this.winners));
                logger.close();

                return clearInterval(loopInterval);
            }
        }

        // Create Round object, push onto Game object
        this.current.round = Round.create(this.current.players);
        this.current.rounds.push(this.current.round);

        // Start Round & Ballot listener
        this.current.round.start();
        global.io.in(this.id).emit('resetVotes');

        // Persist PlayerList

        var playerNames = _.pluck(Database.players.getMany(this.current.players), 'name');

        this.addMessage(Message.create({
            gameID: this.id,
            senderID: 0,
            type: 'PUBLIC',
            content: 'Round ' + this.current.rounds.length + ' has begun!'
        }), global.io);

        this.addMessage(Message.create({
            gameID: this.id,
            senderID: 0,
            type: 'PUBLIC',
            content: 'Remaining Players: ' + playerNames.join(', ')
        }), global.io);

    }, this);

    gameLoop();
    var loopInterval = setInterval(gameLoop, this.timeout);
};
