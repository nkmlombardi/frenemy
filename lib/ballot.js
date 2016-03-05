// Libraries
var _ = require('underscore');

exports.create = function() {
    return new Ballot();
};

function Ballot(id) {
    this.id = global.utility.guid();
    this.votes = [];
    this.open = true;
    this.results = {};
};

Ballot.prototype.closeBallot = function() {
    // var candidates = _.pluck(votes, 'candidates');
    // var balloters = _.pluck(votes, 'balloter');

    // var count = function(ary, classifier) {
    //     return ary.reduce(function(counter, item) {
    //         var p = (classifier || String)(item);
    //         counter[p] = counter.hasOwnProperty(p) ? counter[p] + 1 : 1;
    //         return counter;
    //     }, {});
    // };

    this.results = _.countBy(this.votes, function(vote) {
        return vote.candidate;
    });

    this.open = false;
    // this.results = count(this.votes, function(item) { return item.candidate });
    return this.results;
};

Ballot.prototype.setVotes = function(votes) {
    this.votes = votes;
};

Ballot.prototype.addVote = function(nVote) {
    //this.votes = this.votes.filter(function(vote) {
    //    return !_.isEqual(vote, nVote);
    //});

    return this.votes.push(nVote);
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
