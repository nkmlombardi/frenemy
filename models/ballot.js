// Libraries
var utility = require('../helpers/utility');
var Database = require('../database');
var _ = require('underscore');

exports.create = function() {
    return new Ballot();
};

function Ballot(id) {
    this.id = utility.guid();
    this.votes = [];
    this.open = true;
    this.results = [];
};


Ballot.prototype.randomizeVotes = function(argPlayers) {
    console.log(argPlayers);

    for (var i = 0; i < argPlayers.length; i++) {
        this.addVote({
            balloter: argPlayers[i],
            candidate: argPlayers[Math.floor(Math.random() * argPlayers.length)]
        });
    }
};

Ballot.prototype.close = function() {
    this.open = false;

    var countVotes = _.countBy(this.votes, function(vote) {
        return vote.candidate;
    });

    console.log('ballot count votes: ', countVotes);

    var maxValue = _.max(countVotes, function(value) {
        return value;
    });

    console.log('ballot max value: ', maxValue);

    _.each(countVotes, function(val, key) {
        if (val == maxValue) {
            this.results.push(key);
        }
    }, this);

    return this.results;
};


Ballot.prototype.addVote = function(balloter, candidate) {
    this.votes = this.votes.filter(function(vote) {
        return vote.balloter !== balloter;
    });

    console.log(this.votes);

    this.votes.push({
        balloter: balloter,
        candidate: candidate
    });

    console.log('Vote created!', balloter, candidate);

    return true;
};