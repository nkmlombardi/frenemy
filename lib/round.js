exports.createRound = function(id, players) {
    return new Round(id, players);
};

function Round(id, players) {
    this.id = id;
    this.startPlayers = players;
    this.endPlayers = players;
};


Round.prototype.startRound = function() {
	// Logic to start a round
		// Create Ballot object
}

Round.prototype.endRound = function() {
	// Logic to end a round
		// Close Ballot object
		// Tally votes
		// Log starting Players to Round object
		// Log ending Players to Round object
		// Return ending Players to Game Object
}