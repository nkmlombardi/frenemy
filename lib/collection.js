var Util = require('../utility');
var _ = require('underscore');

// Constructors
exports.create = function() {
    return new Collection();
};


// Class Definition
function Collection() {
    this.id = Util.guid();
    this.storage = [];
    this.lastModified = new Date();
};


/*
 * Gets an item from storage
 * returns:     requested item
 */
Collection.prototype.select = function(id) {
    return _.findWhere(this.storage, { id: id });
};


/*
 * Gets all items from storage
 * returns:     all items
 */
Collection.prototype.selectAll = function() {
    return this.storage;
};


/*
 * Inserts an item into storage
 * returns:     item inserted
 */
Collection.prototype.insert = function(item) {
    this.lastModified = new Date();
    this.storage.push(item);

    console.log('Insert to Collection: ', this.storage);

    return item.id;
};


/*
 * Inserts an item into storage
 * returns:     items inserted
 */
Collection.prototype.insertMany = function(items) {
    this.lastModified = new Date();

    var ids = [];

    _.each(items, function(item) {
        this.storage.push(item);
        ids.push(item.id);
    }, this);

    return ids;
};


/*
 * Updates an item in storage
 * returns:     new storage values
 */
Collection.prototype.update = function(item) {
    this.lastModified = new Date();
    var index = _.findIndex(this.storage, function(object) {
        return item.id == object.id;
    }, this);

    this.storage[index] = item;
    return this.storage;
};


/*
 * Deletes an item from storage
 * returns:     new storage values
 */
Collection.prototype.delete = function(id) {
    this.lastModified = new Date();
    this.storage = this.storage.filter(function(item) {
        return item.id != id;
    }, this);

    return this.storage;
};


/*
 * Retrieves items from storage with map function run on it
 * returns:     storage item with modified properties
 */
Collection.prototype.map = function(mapFunction) {
    return _.map(this.storage, mapFunction, this);
};


/*
 * Retrieves specific properties from storage items
 * returns:     collection of storage items with ids and names
 */
Collection.prototype.listify = function() {
    return this.map(function(item) {
        return {
            id: item.id,
            name: item.name
        };
    });
};

