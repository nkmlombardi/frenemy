'use strict';

/**
 * Returns a new instance of Game with the
 * specified `options`.
 */
exports.createBallot = function (options) {
  return new Ballot(options);
};

/**
 * Master Game Object
 */
function Ballot(options) {
  options = options || {};
  this.players = options.players;
};

Ballot.prototype.castVote = function(voter, voted) {
  this.players[voted].votes.push(voter);
};
