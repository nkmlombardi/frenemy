
exports.create = function(socket) {
    return new Player(socket);
};

function Player(socketID) {
    this.id = global.utility.guid();
    this.name = global.utility.getColor();
    this.socketID = socketID;
};
