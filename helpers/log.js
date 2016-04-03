//Handles logging for gameplay

var winston = require('winston');

module.exports = function (gameID) {
    console.log('In log.js exports, game id', 'is ' + gameID);
    
    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.File)({ filename: './logs/games/' + gameID + '.log'}),
         ]
    })

    return {
        log: function log(level, message) {
            return logger.log(level, message);
        },
        
        close: function close(){
            return logger.close();
        }
    };
}