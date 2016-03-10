var Map = require("collections/map");

module.exports = {
    games:      new Map(),
    players:    new Map(),
    messages:   new Map(),
    rounds:     new Map(),
    ballots:    new Map(),
};

/*
    Custom function to retrieve more than one object from storage at once by
    providing a list of id's.
*/
Map.prototype.getMany = function(keys) {
    return keys.map(function(key) {
        return this.get(key);
    }, this);
};

/*
    Custom function to retrieve only essential properties of an object.
*/
Map.prototype.listify = function(key) {
    var object = this.get(key);
    return {
        id: object.id,
        name: object.name
    };
};

/*
    Custom function to retrieve more than one object from storage at once by
    providing a list of id's, and return only object's id and name.
*/
Map.prototype.listifyMany = function(keys) {
    return this.getMany(keys).map(function(item) {
        return {
            id: item.id,
            name: item.name
        };
    });
};

/*
    Custom function to retrieve only essential properties of all objects.
*/
Map.prototype.listifyAll = function() {
    return this.map(function(item) {
        return {
            id: item.id,
            name: item.name
        };
    });
};
