exports.createPlayer = function(id, name, socket) {
    return new Player(id, name, socket);
};

function Player(id, name, socketID) {
    this.id = id;
    this.name = name;
    this.socketID = socketID;
};
