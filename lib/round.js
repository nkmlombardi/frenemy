// Libraries
var ballot = require('./ballot');
var Util = require('../utility.js');

exports.createRound = function(id, players) {
    return new Round(id, players);
};

function Round(id, players) {
    this.id = id;
    this.startPlayers = players;
    this.endPlayers = players;
    this.ballot = ballot.createBallot(Util.guid());
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

    // Generate random votes for each player, may include themselves
    for (var i = 0; i < this.startPlayers.length; i++) {
        this.ballot.addVote({
            balloter: this.startPlayers[i].name,
            candidate: this.startPlayers[Math.floor(Math.random() * this.startPlayers.length)].name
        });
    }

    console.log(this.ballot.votes);

    var results = this.ballot.closeBallot();

    console.log(results);
};