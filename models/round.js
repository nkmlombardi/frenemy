// Libraries
var utility = require('../helpers/utility');
var Database = require('../database');
var ballot = require('./ballot');

exports.create = function(options) {
    return new Round(options);
};

function Round(options) {
    this.id = utility.guid();
    this.players = options.players;
    this.voted = [];
    this.ballot = ballot.create({ gameID: options.gameID });
    this.gameID = options.gameID;
};

// Start Round
Round.prototype.start = function() {
    // Distribute Tokens
    this.players.forEach(function(player) {
        return Database.players.get(player).addToken(5);
    });
};

// End Round, close Ballot and tally votes
Round.prototype.end = function() {
    this.voted = this.ballot.close();
    return this.voted;
};
