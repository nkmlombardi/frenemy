// Libraries
var _ = require('underscore');

exports.createBallot = function(id) {
    return new Ballot(id);
};

function Ballot(id) {
    this.id = id;
    this.votes = [];
};

Ballot.prototype.setVotes = function(votes) {
    this.votes = votes;
};

Ballot.prototype.addVote = function(nVote) {
    this.votes.filter(function(vote) {
        return !_.isEqual(vote, nVote);
    });

    this.votes.push(nVote);
    return this.votes;
};

Ballot.prototype.createVote = function(balloter, candidate) {
    this.votes.filter(function(vote) {
        return vote.balloter !== balloter;
    });

    this.votes.push({
        balloter: balloter,
        candidate: candidate
    });

    return this.votes;
};

Ballot.prototype.removeVote = function(dVote) {
    this.votes.filter(function(vote) {
        return !_.isEqual(vote, dVote);
    });
    return this.votes;
};

Ballot.prototype.removeVoteByPlayerId = function(balloter) {
    this.votes.filter(function(vote) {
        return vote.balloter !== balloter;
    });
    return this.votes;
};
