var Util = require('../utility');

exports.create = function(playerID, gameID, data) {
    return new Message(playerID, gameID, data);
};

function Message(playerID, gameID, data) {
    this.id = Util.guid();
    this.gameID = gameID;
    this.playerID = playerID;
    this.data = data;
};
