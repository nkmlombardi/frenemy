// Libraries
var utility = require('../helpers/utility');
var Database = require('../database');
var Round = require('./round');
var _ = require('underscore');

// Data Structures
var Set = require("collections/set");
var SortedArraySet = require("collections/sorted-array-set");

// Constructors
exports.create = function(options) {
    var game = new Game(options);
    Database.games.set(game.id, game);
    global.io.emit('addGameToList', { id: game.id, name: game.name });

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

    this.losers = [];
    this.winners = [];

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
};


/*
    Detects the current state of the game, and adds a specified ID to the
    PlayerList depending on that state.
 */
Game.prototype.addPlayer = function(playerID) {
    if (this.current.state === this.states.created) {
        global.io.in(this.id).emit('addPlayerToList', Database.players.listify(playerID));
        return this.players.add(playerID);
    } else if(this.current.state === this.states.playing) {
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
        global.io.in(this.id).emit('removePlayerFromList', Database.players.listify(playerID));
        return this.players.delete(playerID);
    } else if(this.current.state === this.states.playing) {
        global.io.in(this.id).emit('removePlayerFromList', Database.players.listify(playerID));
        this.losers.push(playerID);
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
    if (this.timeout === 0) { return console.log('Attempt was made to start a lobby Game instance.'); }

    // Initialize game state variables
    this.current.players = this.players.clone();
    this.current.state = this.states.playing;

    /*
     * On defined interval, end previous round and create new round. The bind
     * function is in place to allow use of this object inside of the function.
     * The function is getting called once at the beginning so the round begins
     * immediately.
     */
    var gameLoop = _.bind(function() {
        // If this isn't the first round, close previous round
        if (this.current.rounds.length != 0) {
            global.io.in(this.id).emit('updateChat', 'Server', 'Round has ended.');

            // Conclude Round, determine losers
            var voted = this.current.round.end();

            console.log('Receieved ' + voted.length + ' votes this round');

            // Determine if voted players tied for win
            if (this.current.players.length === voted.length) {
                var players = Database.players.listifyMany(voted).map(function(player) { return player.name });
                global.io.in(this.id).emit('updateChat', 'Server', 'The following players have have won the game: ' + players.join(', '));

                // Victory cleanup logic
                this.winners = voted;
                this.current.state = this.states.completed;
                global.io.in(this.id).emit('gameStatus', this);
                return clearInterval(loopInterval);
            }

            // If no votes were submitted, remove random Player
            if (voted.length === 0) {
                var player = Database.players.listify(this.current.players.one());
                global.io.in(this.id).emit('updateChat', 'Server', 'No votes received, random player lost: ' + player.name);
                this.removePlayer(player.id);

            // Otherwise remove all Players tied for most votes
            } else {
                var players = Database.players.listifyMany(voted).map(function(player) { return player.name });
                global.io.in(this.id).emit('updateChat', 'Server', 'The following players have lost: ' + players.join(', '));

                // Remove each loser
                voted.forEach(function(loser) {
                    this.removePlayer(loser.id);
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
                global.io.in(this.id).emit('updateChat', 'Server', 'The following player has won the game: ' + winner.name);

                // Victory cleanup logic
                this.winners.push(winner.id);
                this.current.state = this.states.completed;
                global.io.in(this.id).emit('gameStatus', this);
                return clearInterval(loopInterval);
            }
        }

        // Create Round object, push onto Game object

        this.current.round = Round.create(this.current.players);
        this.current.rounds.push(this.current.round);

        // Start Round & Ballot listener
        this.current.round.start();

        global.io.in(this.id).emit('gameStatus', this);
        global.io.in(this.id).emit('resetVotes');

        // Persist PlayerList

        var playerNames = _.pluck(Database.players.getMany(this.current.players), 'name');

        global.io.in(this.id).emit('updateChat', 'Server', 'Round ' + this.current.rounds.length + ' has begun!');
        global.io.in(this.id).emit('updateChat', 'Server', 'Remaining Players: ' + playerNames.join(', '));

        // console.log(this.current.round);
        // console.log(this.current.rounds);

        // Persist Game Status

    }, this);

    gameLoop();
    var loopInterval = setInterval(gameLoop, this.timeout);
};
