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
    this.status = true;
};
