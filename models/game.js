// Libraries
var utility = require('../helpers/utility');
var Database = require('../database');
var Round = require('./round');
var _ = require('underscore');

var Set = require("collections/set");
var SortedArraySet = require("collections/sorted-array-set");
// Data Structures

// Constructors
exports.create = function(options) {
    return new Game(options);
};

// Class
function Game(options) {
    // Properties set on initialization of object
    this.id = utility.guid();
    this.name = options.name || this.id;
    this.created = new Date();
    this.timeout = options.timeout || 120000;
    this.players = new Set();
    this.socket = options.io;

    this.losers = [];
    this.winners = [];

    // States a Game object can be in
    this.states = Object.freeze({
        created: 0,
        playing: 1,
        completed: 2
    });

    // Properties determined by the state of the game
    this.current = {
        state: this.states.created,
        players: new Set(),
        rounds: new Set(),
        round: false
    };

    /*
        On change of the Game object's PlayerList, emit those changes to the
        ClientSide so the view layer may be updated.
     */
    // this.players.addRangeChangeListener(function(plus, minus, index) {
    //     console.log("Player Array Changed: added: ", plus, " removed: ", minus, " at ", index);
    //
    //     console.log('getMany: ', Database.players.getMany(this.toArray()));
    //
    //     // Emit Change
    //     global.io.emit('updatePlayerList', Database.players.listifyMany(this.toArray()));
    // });

    this.players.bind(this);
    this.players.addRangeChangeListener(function(plus, minus, index) {
        // plus.forEach(function(player) {
        //     socket.broadcast.to(socket.game.id).emit('addPlayerToList', _.pick(socket.player, 'id', 'name'));
        // });
        //
        // minus.forEach(function(player) {
        //     socket.broadcast.to(socket.game.id).emit('addPlayerToList', _.pick(socket.player, 'id', 'name'));
        // })
        //
        // socket.broadcast.to(socket.game.id).emit('addPlayerToList', _.pick(socket.player, 'id', 'name'));

        console.log('Listener This: ', this.current);

    });
};


/*
    Detects the current state of the game, and adds a specified ID to the
    PlayerList depending on that state.
 */
Game.prototype.addPlayer = function(playerID) {
    if (this.current.state === this.states.created) {
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
        return this.players.delete(playerID);
    } else if(this.current.state === this.states.playing) {
        return this.current.players.delete(playerID);
    } else {
        console.error('Game.removePlayer() was called on a game that has ended.');
        return false;
    }
};


/*
    Initiator Methods
 */
Game.prototype.startGame = function() {
    // Check to see if Game object is actually a Lobby, and not a real Game
    if (this.timeout === 0) { return console.log('Attempt was made to start a lobby Game instance.'); }

    // Initialize game state variables
    this.current.players = this.players.clone();
    this.current.state = this.states.playing;

    // Persist Game Status

    /*
     * On defined interval, end previous round and create new round. The bind
     * function is in place to allow use of this object inside of the function.
     * The function is getting called once at the beginning so the round begins
     * immediately.
     */
    var loopFunction = _.bind(function() {
        // If this isn't the first round, close previous round
        if (this.current.rounds.length != 0) {
            global.io.in(this.id).emit('updateChat', 'Server', 'Round has ended.');

            var losingPlayers = this.current.round.endRound();

            this.current.players = _.difference(this.current.players, losingPlayers);


            var fullLosingPlayers = global.players.selectMany(losingPlayers);
            var losingNames = _.pluck(fullLosingPlayers, 'name');

            this.losers = _.union(fullLosingPlayers, this.losers);

            // Invalidate Players
            _.each(fullLosingPlayers, function(player) {
                player.status = false;
                global.players.update(player);
            });

            console.log(losingNames);


            // Persist PlayerList

            global.io.in(this.id).emit('gameStatus', this);

            // Check for winners, if so break the loop
            if (this.current.players.length == 0) {
                global.io.in(this.id).emit('updateChat', 'Server', 'The following players have have won the game: ' + losingNames.join(', '));

                this.winners = _.union(fullLosingPlayers, this.winners);

                // Persist PlayerList

                return clearInterval(gameLoop);

            } else if (this.current.players.length == 1) {
                var winner = global.players.select(this.current.players[0]);
                global.io.in(this.id).emit('updateChat', 'Server', 'The following player has won the game: ' + winner.name);

                this.winners.push(winner);

                // Persist PlayerList

                return clearInterval(gameLoop);

            } else {
                global.io.in(this.id).emit('updateChat', 'Server', 'The following players have lost: ' + losingNames.join(', '));
            }
        }

        // Create Round object, push onto Game object

        this.current.round = Round.create(this.current.players);
        this.current.rounds.push(this.current.round);

        // Start Round & Ballot listener
        this.current.round.start();

        global.io.in(this.id).emit('resetVotes');

        // Persist PlayerList

        var playerNames = _.pluck(global.players.selectMany(this.current.players), 'name');

        global.io.in(this.id).emit('updateChat', 'Server', 'Round ' + this.current.rounds.length + ' has begun!');
        global.io.in(this.id).emit('updateChat', 'Server', 'Remaining Players: ' + playerNames.join(', '));

        // console.log(this.current.round);
        // console.log(this.current.rounds);

        // Persist Game Status

    }, this);

    loopFunction();
    var gameLoop = setInterval(loopFunction, this.timeout);
};
