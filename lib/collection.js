var _ = require('underscore');

// Constructors
exports.create = function() {
    return new Collection();
};


// Class Definition
function Collection() {
    this.id = global.utility.guid();
    this.storage = [];
    this.lastModified = new Date();
};


/*
 * Gets an item from storage by id
 * returns:     requested item object
 */
Collection.prototype.select = function(id) {
    return _.findWhere(this.storage, { id: id });
};


/*
 * Gets defined items from storage by id
 * TODO: This could probably be more efficient
 * returns:     requested items objects
 */
Collection.prototype.selectMany = function(ids) {
    return _.map(ids, function(id) {
        return this.select(id);
    }, this);
};


/*
 * Gets all items from storage
 * returns:     all item objects
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

    // console.log('Insert to Collection: ', this.storage);

    return item.id;
};


/*
 * Inserts an item into storage
 * returns:     items inserted
 */
Collection.prototype.insertMany = function(items) {
    this.lastModified = new Date();

    // Array to keep track of ID's
    var ids = [];

    // Foreach new item, push it to the storage
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
    });

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
    });

    return this.storage;
};


/*
 * Retrieves items from storage with map function run on it
 * returns:     storage item with modified properties
 */
Collection.prototype.map = function(mapFunction) {
    return _.map(this.storage, mapFunction, this);
};