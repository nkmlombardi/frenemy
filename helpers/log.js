//Handles logging for gameplay
module.log = {

    /*winston = require('winston'),
    
    // Set up transport
    logger = new (winston.Logger)({
        transports: [
        new (winston.transports.File)({ filename: './logs/logged_info.log' })
        ]
    }),*/    

    guid: function() {
        
        winston = require('winston'),
    
        // Set up transport
        logger = new (winston.Logger)({
            transports: [
            new (winston.transports.File)({ filename: './logs/logged_info.log' })
            ]
        }),
        
        function something() {
        
            if (index == 1) {
                logger.log('info', socket.player.name + ' has voted for ' + Database.players.get(target).name);
            }
    
            if (index == 2) {
                logger.log('info', 'Nobody voted, so we removed' + player.name);
            }
    
            if (index == 3) {
                logger.log('info', players.join(', ') + ' was/were voted off');
            }
    
            if (index == 4) {
                logger.log('info', winner.name + ' won');
            }
    
            if (index == 5) {
                logger.log('info', this.senderID + 'sent a public message');
            }
    
            if (index == 6) {
                logger.log('info', Database.players.listify(this.senderID) + 'sent a message to' + Database.players.listify(this.recipientID));
            }
            return;
        }
        return something();
    }
};