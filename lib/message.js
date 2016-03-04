var Util = require('../utility');

exports.create = function(playerID, data) {
    return new Message(playerID, data);
};

function Message(playerID, data) {
    this.id = Util.guid();
    this.playerID = playerID;
    this.data = data;
};
