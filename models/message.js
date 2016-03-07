var utility = require('../helpers/utility');

exports.create = function(playerID, gameID, data) {
    return new Message(playerID, gameID, data);
};

function Message(playerID, gameID, data) {
    this.id = utility.guid();
    this.gameID = gameID;
    this.playerID = playerID;
    this.data = data;
};
