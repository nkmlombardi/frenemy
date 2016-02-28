exports.createRound = function(id, timeout, players) {
    return new Round(id, timeout, players);
};

function Round(id, timeout, players) {
    this.id = id;
    this.timeout = timeout;
    this.players = players;
};

Round.prototype.decrementTimeout = function() {
    return --timeout;
};
