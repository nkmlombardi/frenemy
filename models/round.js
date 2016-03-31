// Libraries
var utility = require('../helpers/utility');
var Database = require('../database');
var ballot = require('./ballot');

exports.create = function(players) {
    return new Round(players);
};

function Round(players) {
    this.id = utility.guid();
    this.players = players;
    this.voted = [];
    this.ballot = ballot.create();
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
