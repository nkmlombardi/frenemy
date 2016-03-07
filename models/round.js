// Libraries
var utility = require('../helpers/utility');
var ballot = require('./ballot');
var _ = require('underscore');

exports.create = function(players) {
    return new Round(players);
};

function Round(players) {
    this.id = utility.guid();
    this.startPlayers = players;
    this.endPlayers = players;
    this.ballot = ballot.create();
};


Round.prototype.startRound = function() {
    // Logic to start a Round
    // Make Ballot listen for votes

};

Round.prototype.endRound = function() {
    // Logic to end a Round
    // Close Ballot object
    // Tally votes
    // Log starting Players to Round object
    // Log ending Players to Round object
    // Return ending Players to Game Object

    console.log('this.votes: ', this.ballot.votes);

    // Generate random votes for each player, may include themselves
    console.log('Round:\n--- startPlayers: ', this.startPlayers);
    // this.ballot.randomizeVotes(this.startPlayers);
    // console.log('Generate Votes: ', this.ballot.votes);

    var losingPlayers = this.ballot.closeBallot();

    this.endPlayers = _.difference(this.startPlayers, losingPlayers);

    console.log('losingPlayers: ', losingPlayers);

    return losingPlayers; // List of IDs
};
