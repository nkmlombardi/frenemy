//// Utility Libraries
var _ = require('underscore');

//// Frenemy Libraries
var Util = require('../utility');
var Collection = require('../lib/collection');
var Game = require('../lib/game');
var Player = require('../lib/player');
var Message = require('../lib/message');


var games = Collection.create();
var selectIndexes = [];

for (var i = 0; i < 5; i++) {
	var newGameId = games.insert(Game.create([], { name: i }));
	selectIndexes.push(newGameId);
}

console.log('--- Games: ', games);


var gameObjects = games.selectMany(selectIndexes);

console.log('--- Game Objects: ', gameObjects);
