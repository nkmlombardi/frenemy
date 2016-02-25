'use strict';

var _ = require('underscore');

/**
 * Returns a new instance of Game with the
 * specified `options`.
 */
exports.createGame = function (options) {
  return new Game(options);
};

/**
 * Master Game Object
 */
function Game(options) {
  options = options || {};
  var counter = Game.prototype.counter++;

  this.id = counter;
  this.init = {};
  this.current = {};
  this.finish = {};

  // Properties set on initialization
  this.init.owner = options.owner;
  this.init.room = 'game_' + counter;
  this.init.created = new Date();
  this.init.players = [options.owner];
  this.init.rounds = 0;

  // Properties that dynamically change
  this.current.modified = new Date();
  this.current.players = [options.owner];
  this.current.round = 0;
  this.current.status = 'created';

  // Properties for logging purposes
  this.finish.ended = false;
  this.finish.winner = false;
};

Game.prototype.counter = 0;

Game.prototype.startGame = function() {
  // if (this.init.players.length < REQUIREDPLAYERS)
  //   return false;

  // Create deep copy of playerlist
  this.current.status = 'started';
  this.current.rounds = (this.init.players.length - 1);
  this.current.players = _.extend(this.init.players);
  this.current.modified = new Date();
};

Game.prototype.endGame = function() {
  console.log('Winners: ', this.currentPlayers);
}
