// Libraries
var _ = require('underscore');
var round = require('./round');

exports.createGame = function(id, players, options, socket) {
    return new Game(id, players, options, socket);
};

exports.findGameById = function(games, id) {
    return games.filter(function(game) {
        return game.id == id;
    })[0];
};

function Game(id, players, options, socket) {
    // Properties set on initialization of object
    this.id = id;
    this.name = options.name || id;
    this.created = new Date();
    this.players = players;
    this.timeout = options.timeout;
    this.socket = socket;

    // Properties determined by the state of the game
    this.current = {
        state: 'CREATED',       // created, round, completed
        modified: new Date(),
        players: players,
        rounds: [],
        round: {}
    };
};

Game.prototype.setPlayers = function(players) {
    if (this.players && this.players.constructor === Array) {
        this.players = players;
    } else {
        return false;
    }
    return this.players;
};

Game.prototype.addPlayer = function(player) {
    this.current.players.push(player);
    return this.current.players.push(player);
};

Game.prototype.findPlayer = function(fPlayer) {
    return this.current.players.filter(function(player) {
        return _.isEqual(player, dPlayer);
    });
};

Game.prototype.removePlayer = function(dPlayer) {
    return this.current.players.filter(function(player) {
        return !_.isEqual(player, dPlayer);
    });
};

Game.prototype.findPlayerById = function(id) {
    return this.current.players.filter(function(player) {
        return player.id == id;
    });
};

Game.prototype.removePlayerById = function(id) {
    return this.current.players.filter(function(player) {
        return player.id != id;
    });
};




Game.prototype.startGame = function() {

    /*
     * On defined interval, end previous round and create new round. The bind 
     * function is in place to allow use of this object inside of the function.
     */
    setInterval(_.bind(function() {
        // If this isn't the first round, close previous round
        if (this.current.rounds.length != 0) {
            console.log("- Round ended.");
            this.socket.emit('updatechat', 'Server', 'Round has ended.');
            this.current.round.endRound();
        }

        // Create Round object, push onto Game object
        console.log('+ Round Started!');
        this.current.round = round.createRound('ROUND_ID', this.current.players);
        this.current.rounds.push(this.current.round);

        // Start Round & Ballot listener
        // this.current.round.startRound();

        var playerOutput = '';
        
        for (var i = 0; i < this.current.players.length; i++) {
            playerOutput += this.current.players[i].name + ' ';
        }

        this.socket.emit('updatechat', 'Server', 'Round has begun!');
        this.socket.emit('updatechat', 'Server', 'Current players:' + playerOutput);

        // _.each(this.current.players, function(element, index, list) {
        //     this.socket.emit('updatechat', 'Server', element.name);
        // });

        console.log(this.current.round);
        console.log(this.current.rounds);

    }, this), this.timeout);
};



