// Libraries
var _ = require('underscore');
var round = require('./round');

exports.createGame = function(id, players) {
    return new Game(id, players);
};

function Game(id, players) {
    this.id = id;

    // Properties set on initialization of object
    this.init = {
        room: 'game_' + id,
        created: new Date(),
        players: players
    };

    // Properties determined by the state of the game
    this.current = {
        status: 'created',
        modified: new Date()
        players: players,
        rounds: []
    };
};

Game.prototype.setStatus = function(status) {
    this.status = status;
};

Game.prototype.setModified = function(modified) {
    if (Object.prototype.toString.call(date) === '[object Date]') {
        this.modified = modified;
    } else {
        return false;
    }
    return this.modified;
};

Game.prototype.updateModified = function() {
    this.modified = new Date();
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
    this.players.push(player);
    return this.players.push(player);
};

Game.prototype.findPlayer = function(fPlayer) {
    return this.players.filter(function(player) {
        return _.isEqual(player, dPlayer);
    });
};

Game.prototype.removePlayer = function(dPlayer) {
    return this.players.filter(function(player) {
        return !_.isEqual(player, dPlayer);
    });
};

Game.prototype.findPlayerById = function(id) {
    return this.players.filter(function(player) {
        return player.id == id;
    });
};

Game.prototype.removePlayerById = function(id) {
    return this.players.filter(function(player) {
        return player.id != id;
    });
};


Game.prototype.startGame = function() {

    // Every 2 minutes, cycle through a new round
    setInterval(function() {
        // Create a Round object which creates a Ballot object
        this.current.rounds.push(round.createRound('ID', this.current.players));

        // Ballot listens for votes
        // Game closes Round which closes Ballot
        // Ballot returns votes to Round
        // Round determines losers and returns to Game
        // Game removes Players
        // 
    }, 60 * 1000 * 2)
}