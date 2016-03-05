
exports.create = function(playerID, gameID, data) {
    return new Message(playerID, gameID, data);
};

function Message(playerID, gameID, data) {
    this.id = global.utility.guid();
    this.gameID = gameID;
    this.playerID = playerID;
    this.data = data;
};
