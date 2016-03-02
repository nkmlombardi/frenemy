exports.createPlayer = function(id, name) {
    return new Player(id, name);
};

function Player(id, name) {
    this.id = id;
    this.name = name;
};