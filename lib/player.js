var Util = require('../utility');

exports.create = function(socket) {
    return new Player(socket);
};

function Player(socketID) {
    this.id = Util.guid();
    this.name = Util.getColor();
    this.socketID = socketID;
};

Player.prototype.listify = function() {
    return {
        id: this.id,
        name: this.name
    };
};
