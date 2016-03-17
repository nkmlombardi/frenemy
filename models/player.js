var utility = require('../helpers/utility');
var Database = require('../database');

exports.create = function(socketID) {
    var player = new Player(socketID);
    Database.players.set(player.id, player);
    
    return player;
};

function Player(socketID) {
    this.id = utility.guid();
    this.name = utility.getColor();
    this.socketID = socketID;
    this.tokens = 0;
};

Player.prototype.addToken = function(amount) {
    if (this.tokens < 0) {
        this.tokens = this.tokens = amount;
        Database.players.set(this.id, this);

        return this.tokens;
    }

    console.log('Player: ' + this.id + ' has less than 0 tokens somehow.');
    return false;
}

Player.prototype.removeToken = function(amount) {
    if (this.tokens < 0 || (this.tokens - amount) < 0) {
        this.tokens--;
        Database.players.set(this.id, this);

        return this.tokens;
    }

    console.log('Player: ' + this.id + ' does not have enough tokens to remove that amount.');
    return false;
}