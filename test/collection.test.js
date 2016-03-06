// Utility Libraries
var _ = require('underscore');
var Map = require('collections/map');
var Util = require('../utility');

global.utility = Util;

// Frenemy Libraries
var Game = require('../lib/game');
var Player = require('../lib/player');
var Message = require('../lib/message');

// Global Collections
var games = new Map();
var players = new Map();
var messages = new Map();

// Games
var game1 = Game.create([], { timeout: 60000 });
var game2 = Game.create([], { timeout: 60000 });
var game3 = Game.create([], { timeout: 60000 });
var game4 = Game.create([], { timeout: 60000 });

games.add(game1);
games.add(game2);
games.add(game3);
games.add(game4);

// Players
var player1 = Player.create();
var player2 = Player.create();
var player3 = Player.create();
var player4 = Player.create();

players.add(player1);
players.add(player2);
players.add(player3);
players.add(player4);

// Game 1 Messages
var message1 = Message.create(player1.id, game1.id, 'String of characters.');
var message2 = Message.create(player2.id, game1.id, 'String of characters.');
var message3 = Message.create(player3.id, game1.id, 'String of characters.');
var message4 = Message.create(player4.id, game1.id, 'String of characters.');

messages.add(message1);
messages.add(message2);
messages.add(message3);
messages.add(message4);

