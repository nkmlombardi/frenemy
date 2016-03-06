// Libraries
var _ = require('underscore');
var Round = require('./round');
var Collection = require('./collection');

// Constructors
exports.create = function(players, options) {
    return new Game(players, options);
};

// Class
function Game(players, options) {
    // Properties set on initialization of object
    this.id = global.utility.guid();
    this.name = options.name || this.id;
    this.created = new Date();
    this.timeout = options.timeout;
    this.players = players;
    this.messages = [];
    this.socket = options.io;

    this.losers = [];
    this.winners = [];

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
    console.log('Game: Player Registered:\n', playerID, this.players);

    return this.players.push(playerID);
};

Game.prototype.unregisterPlayer = function(playerID) {
    this.players = _.without(this.players, playerID);

    console.log('Game: Player Unregistered:\n', playerID, this.players);

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
Game.prototype.startGame = function() {
    if (this.type == 'lobby' || this.timeout == 0) {
        return console.log('Attempt was made to start a lobby Game instance.');
    }

    // Initialize game state variables
    this.current.players = this.players.slice(0);
    this.current.state = 'STARTED';
    this.current.modified = new Date();
    this.current.rounds = [];
    this.current.round = {};

    global.io.in(this.id).emit('gameStatus', this);

    console.log('Current Players Array: ', this.current.players);

    /*
     * On defined interval, end previous round and create new round. The bind
     * function is in place to allow use of this object inside of the function.
     * The function is getting called once at the beginning so the round begins 
     * immediately.
     */
    var loopFunction = _.bind(function() {
        // If this isn't the first round, close previous round
        if (this.current.rounds.length != 0) {
            console.log("- Round ended.");
            global.io.in(this.id).emit('updateChat', 'Server', 'Round has ended.');
            var losingPlayers = this.current.round.endRound();

            this.current.players = _.difference(this.current.players, losingPlayers);

            console.log('Current Players: ', this.current.players);
            console.log('Round endPlayers: ', this.current.round.endPlayers);

            var fullLosingPlayers = global.players.selectMany(losingPlayers);
            var losingNames = _.pluck(fullLosingPlayers, 'name');

            this.losers = _.union(fullLosingPlayers, this.losers);

            // Invalidate Players
            _.each(fullLosingPlayers, function(player) {
                player.status = false;
                global.players.update(player);
            });

            console.log(losingNames);


            global.io.in(this.id).emit('updatePlayerList', 
                global.players.selectMany(this.current.players).map(function(item) {
                    return {
                        id: item.id,
                        name: item.name
                    };
                })
            );

            global.io.in(this.id).emit('gameStatus', this);

            // Check for winners, if so break the loop
            if (this.current.players.length == 0) {
                global.io.in(this.id).emit('updateChat', 'Server', 'The following players have have won the game: ' + losingNames.join(', '));
                
                this.winners = _.union(fullLosingPlayers, this.winners);

                // Send Winners
                global.io.in(this.id).emit('updatePlayerList', 
                    global.players.selectMany(this.current.players).map(function(item) {
                        return {
                            id: item.id,
                            name: item.name
                        };
                    })
                );

                return clearInterval(gameLoop);

            } else if (this.current.players.length == 1) {
                var winner = global.players.select(this.current.players[0]);
                global.io.in(this.id).emit('updateChat', 'Server', 'The following player has won the game: ' + winner.name);
                
                this.winners.push(winner);

                // Send Winner
                global.io.in(this.id).emit('updatePlayerList', 
                    global.players.selectMany(this.current.players).map(function(item) {
                        return {
                            id: item.id,
                            name: item.name
                        };
                    })
                );

                return clearInterval(gameLoop);

            } else {
                global.io.in(this.id).emit('updateChat', 'Server', 'The following players have lost: ' + losingNames.join(', '));
            }
        }

        // Create Round object, push onto Game object
        console.log('+ Round ' + this.current.rounds.length + ' Started!');
        this.current.round = Round.create(this.current.players);
        this.current.rounds.push(this.current.round);

        // Start Round & Ballot listener
        this.current.round.startRound();
        global.io.in(this.id).emit('resetVotes');

        global.io.in(this.id).emit('updatePlayerList', 
            global.players.selectMany(this.current.players).map(function(item) {
                return {
                    id: item.id,
                    name: item.name
                };
            })
        );

        var playerNames = _.pluck(global.players.selectMany(this.current.players), 'name');

        global.io.in(this.id).emit('updateChat', 'Server', 'Round ' + this.current.rounds.length + ' has begun!');
        global.io.in(this.id).emit('updateChat', 'Server', 'Remaining Players: ' + playerNames.join(', '));

        // console.log(this.current.round);
        // console.log(this.current.rounds);

        global.io.in(this.id).emit('gameStatus', this);

    }, this);

    loopFunction();
    var gameLoop = setInterval(loopFunction, this.timeout);
};