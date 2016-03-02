// Libraries
var ballot = require('./ballot');

exports.createRound = function(id, players) {
    return new Round(id, players);
};

function Round(id, players) {
    this.id = id;
    this.startPlayers = players;
    this.endPlayers = players;
    this.ballot = ballot.createBallot('BALLOT_ID');
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
};