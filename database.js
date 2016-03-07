var Collection = require('./models/collection');

/*
    This is meant to emulate a database. Each variable below is a table, while
    this entire file is considered the database.
 */
module.exports = {
    games: Collection.create(),
    players: Collection.create(),
    messages: Collection.create(),
    rounds: Collection.create(),
    ballots: Collection.create()
};