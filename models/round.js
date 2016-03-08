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
    this.voted = new Set();
    this.ballot = ballot.create();
};

// Start Round
Round.prototype.start = function() {
    // Nothing at the moment
};

// End Round, close Ballot and tally votes
Round.prototype.end = function() {
    this.voted = this.ballot.close();
    return _.difference(this.players, this.voted);
};
