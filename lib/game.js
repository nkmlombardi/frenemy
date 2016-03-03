// Libraries
var _ = require('underscore');
var round = require('./round');
var Util = require('../utility.js');

// Constructors
exports.createGame = function(id, players, options) {
    return new Game(id, players, options);
};

exports.createLobby = function(id, players, options) {
    return new Game(id, players, options);
};

// Global Functions
exports.findGameById = function(games, id) {
    return games.filter(function(game) {
        return game.id == id;
    })[0];
};

// Class
function Game(id, players, options) {
    // Properties set on initialization of object
    this.id = id;
    this.name = options.name || id;
    this.created = new Date();
    this.players = players;
    this.timeout = options.timeout;

    // For defining a Lobby
    this.type = this.type;

    // Properties determined by the state of the game
    this.current = {
        state: 'CREATED', // created, round, completed
        modified: new Date(),
        players: players,
        rounds: [],
        round: {}
    };
};


/*
    Initialization Methods
 */
Game.prototype.registerPlayer = function(player) {
    return this.players.push(player);
};

Game.prototype.unregisterPlayer = function(dPlayer) {
    return this.players = this.players.filter(function(player) {
        return !_.isEqual(player, dPlayer);
    });
};

Game.prototype.unregisterPlayerById = function(dPlayer) {
    return this.players = this.players.filter(function(player) {
        return player.id != dPlayer.id;
    });
};


/*
    Stateful Methods
 */
Game.prototype.findPlayer = function(fPlayer) {
    return this.current.players.filter(function(player) {
        return _.isEqual(player, dPlayer);
    });
};

Game.prototype.removePlayer = function(dPlayer) {
    return this.current.players = this.current.players.filter(function(player) {
        return !_.isEqual(player, dPlayer);
    });
};


/*
    Initiator Methods
 */
Game.prototype.startGame = function(io) {
    if (this.type == 'lobby' || this.timeout == 0) {
        return console.log('Attempt was made to start a lobby Game instance.');
    }

    this.current.state = 'STARTED';
    io.in(this.id).emit('gameStatus', this);

    /*
     * On defined interval, end previous round and create new round. The bind
     * function is in place to allow use of this object inside of the function.
     */
    setInterval(_.bind(function() {
        // If this isn't the first round, close previous round
        if (this.current.rounds.length != 0) {
            console.log("- Round ended.");
            io.in(this.id).emit('updateChat', 'Server', 'Round has ended.');
            this.current.round.endRound();
        }

        // Create Round object, push onto Game object
        console.log('+ Round Started!');
        this.current.round = round.createRound(Util.guid(), this.current.players);
        this.current.rounds.push(this.current.round);

        // Start Round & Ballot listener
        // this.current.round.startRound();

        var playerOutput = '';

        for (var i = 0; i < this.current.players.length; i++) {
            playerOutput += this.current.players[i].name + ' ';
        }

        io.in(this.id).emit('updateChat', 'Server', 'Round has begun!');
        io.in(this.id).emit('updateChat', 'Server', 'Remaining Players: [ ' + playerOutput + ' ]');

        // console.log(this.current.round);
        // console.log(this.current.rounds);

    }, this), this.timeout);
};
