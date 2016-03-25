var utility = require('../helpers/utility');
var Database = require('../database');
var winston = require('winston');

// Logging Setup
var logger = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({ filename: 'logged_info.log' })
    ]
});

exports.create = function(options) {
    var message = new Message(options);
    Database.messages.set(message.id, message);

    return message;
};

function Message(options) {
    this.id = utility.guid();
    this.gameID = options.gameID;
    this.senderID = options.senderID || 0;
    this.recipientID = options.recipientID || 0;
    this.types = Object.freeze({
        public: 'PUBLIC',
        private: 'PRIVATE',
        self: 'SELF',
        others: 'OTHERS'
    });
    this.type = options.type || this.types.public;
    this.content = options.content;
};

Message.prototype.persist = function() {
    if (this.type === this.types.public) {
        logger.log('info', this.senderID + 'sent a public message');
        return {
            id: this.id,
            sender: (this.senderID === 0 ? { id: this.senderID, name: 'Server' } : Database.players.listify(this.senderID)),
            type: this.type,
            content: this.content
        };

    } else if (this.type === this.types.private) {
        logger.log('info', Database.players.listify(this.senderID) + 'sent a message to' + Database.players.listify(this.recipientID));
        return {
            id: this.id,
            sender: (this.senderID == 0 ? { id: this.senderID, name: 'Server' } : Database.players.listify(this.senderID)),
            recipient: Database.players.listify(this.recipientID),
            type: this.type,
            content: this.content
        };

    } else if (this.type === this.types.self) {
        return {
            id: this.id,
            sender: { id: this.senderID, name: 'Server' },
            type: this.type,
            content: this.content
        };

    } else if (this.type === this.types.others) {
        return {
            id: this.id,
            sender: (this.senderID === 0 ? { id: this.senderID, name: 'Server' } : Database.players.listify(this.senderID)),
            type: this.type,
            content: this.content
        };
    }
};
