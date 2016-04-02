// Libraries
var utility = require('../helpers/utility');
var ballot = require('./ballot');
var _ = require('underscore');

// Data Structures
var Set = require("collections/set");

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
    _.each(this.players, function(player) {
        //return player.addToken(5);
    });
};

// End Round, close Ballot and tally votes
Round.prototype.end = function() {
    this.voted = this.ballot.close();
    return this.voted;
};
