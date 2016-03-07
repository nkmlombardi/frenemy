var utility = require('../helpers/utility');

exports.create = function(socket) {
    return new Player(socket);
};

function Player(socketID) {
    this.id = utility.guid();
    this.name = utility.getColor();
    this.socketID = socketID;
    this.status = true;
};
