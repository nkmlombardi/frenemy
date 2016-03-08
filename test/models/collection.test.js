// Utility Libraries
var _ = require('underscore');
var Map = require('collections/map');
var Set = require('collections/set');

Map.prototype.getMany = function(keys) {
    return keys.map(function(key) {
        return this.get(key);
    }, this);
};

Map.prototype.listify = function(idList) {
    return idList.getMany(idList).map(function(item) {
        return {
            id: item.id,
            name: item.name
        };
    });
};

// Frenemy Libraries
var Game = require('../../models/game');
var Player = require('../../models/player');
var Message = require('../../models/message');

// Global Collections
var games = new Map();
var players = new Map();
var messages = new Set();

// Games
var game1 = Game.create([], { timeout: 60000 });
var game2 = Game.create([], { timeout: 60000 });
var game3 = Game.create([], { timeout: 60000 });
var game4 = Game.create([], { timeout: 60000 });

games.set(game1);
games.set(game2);
games.set(game3);
games.set(game4);

// Players
var player1 = Player.create();
var player2 = Player.create();
var player3 = Player.create();
var player4 = Player.create();

players.set(player1.id, player1);
players.set(player2.id, player2);
players.set(3, player3);
players.set(4, player4);

// Game 1 Messages
var message1 = Message.create(player1.id, game1.id, 'String of characters.');
var message2 = Message.create(player2.id, game1.id, 'String of characters.');
var message3 = Message.create(player3.id, game1.id, 'String of characters.');
var message4 = Message.create(player4.id, game1.id, 'String of characters.');

messages.add(message1);
messages.add(message2);
messages.add(message3);
messages.add(message4);



console.log(players.getMany([player1.id, player2.id]));


// console.log(players.get(player1.id));
