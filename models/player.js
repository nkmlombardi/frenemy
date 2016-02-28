exports.createPlayer = function(id, tokens) {
    return new Player(id, tokens);
};

function Player(id, tokens) {
    this.id = id;
    this.tokens = tokens;
};

Player.prototype.addTokens = function(tokens) {
    this.tokens += tokens;
    return tokens;
};

Player.prototype.removeTokens = function(tokens) {
    this.tokens -= tokens;
    return tokens;
};