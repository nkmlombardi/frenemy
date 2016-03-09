var utility = require('../helpers/utility');
var Database = require('../database');

exports.create = function(playerID, gameID, data) {
    var message = new Message(playerID, gameID, data);
    Database.messages.set(message.id, message);

    return message;
};

function Message(playerID, gameID, data) {
    this.id = utility.guid();
    this.gameID = gameID;
    this.playerID = playerID;
    this.data = data;
};
