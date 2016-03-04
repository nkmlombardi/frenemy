// Libraries
var _ = require('underscore');
var Util = require('../utility');
var Round = require('./round');

// Constructors
exports.create = function(players, options) {
    return new Game(players, options);
};

// Class
function Game(players, options) {
    // Properties set on initialization of object
    this.id = Util.guid();
    this.name = options.name || this.id;
    this.created = new Date();
    this.timeout = options.timeout;
    this.players = players;

    // For defining a Lobby
    this.type = options.type;

    // Properties determined by the state of the game
    this.current = {
        state: 'CREATED', // created, round, completed
        modified: false,
        players: false,
        rounds: false,
        round: false
    };
};


/*
    Initialization Methods
 */
Game.prototype.registerPlayer = function(playerID) {
    return this.players.push(playerID);
};

Game.prototype.unregisterPlayer = function(playerID) {
    this.players = _.without(this.players, playerID);
    return this.players;
};


/*
    Stateful Methods
 */
Game.prototype.removePlayer = function(playerID) {
    this.current.players = _.without(this.current.players, playerID);
    return this.current.players;
};


/*
    Initiator Methods
 */
Game.prototype.startGame = function(io, games, players, messages) {
    if (this.type == 'lobby' || this.timeout == 0) {
        return console.log('Attempt was made to start a lobby Game instance.');
    }

    // Initialize game state variables
    this.current.players = this.players.slice(0);
    this.current.state = 'STARTED';
    this.current.modified = new Date();
    this.current.rounds = [];
    this.current.round = {};

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
        this.current.round = Round.create(this.current.players);
        this.current.rounds.push(this.current.round);

        // Start Round & Ballot listener
        // this.current.round.startRound();

        io.in(this.id).emit('updateChat', 'Server', 'Round has begun!');
        io.in(this.id).emit('updateChat', 'Server', 'Remaining Players: ' + players.map(function(item) { return item.name }).join(', '));

        // console.log(this.current.round);
        // console.log(this.current.rounds);

        io.in(this.id).emit('gameStatus', this);

    }, this), this.timeout);
};