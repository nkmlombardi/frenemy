//Handles logging for gameplay

var winston = require('winston');

module.exports = function () {
    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.File)({ filename: './logs/logged_info.log' }),
         ]
    })

    return {
        log: function log(level, message) {
            return logger.log(level, message);
        }
    };
}