// Libraries
var _ = require('underscore');

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

// Game.prototype.setRound = function(round) {
//     if (round % 1 === 0) {
//         this.round = round;
//     } else
//         return false;
//     }
//     return this.round;
// };

// Game.prototype.incrementRound = function() {
//     return ++this.current.round;
// };