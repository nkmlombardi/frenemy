var socket = io.connect('http://localhost:8080');

angular.module('app', [])
   .controller('MainController', function($scope) {


    /*
     * Client Side Collections
     * These collections contain pointers in the form of ID's to objects on 
     * the server side to be referenced.
     */
    $scope.games = [];
    $scope.players = [];
    $scope.messages = [];


    /*
     * Client's Objects
     * This contains complete Objects, not pointers of the client. A client 
     * should only have access to their own Player and Game object, and only 
     * references (not complete information) of other Players and Games.
     */
    $scope.client = {
        game: false,
        player: false,
        vote: false
    };

    /*
     * Keep the scroll position at the bottom of the page
     */
    function updateScroll(){
        var element = document.getElementById("conversation");
        element.scrollTop = element.scrollHeight;
    }


    /*
     * Connection Events
     * These are events that are triggered by new clients connecting to the 
     * Frenemy server.
     */
    socket.on('connect', function() {
        console.log('Event: connect');

        $scope.messages = [];
        socket.emit('playerLogin');
    });


    /*
     * Message Events
     * These are events that are triggered by Message objects getting created 
     * in the backend which are triggered by Player actions.
     */
    socket.on('updateChat', function(username, data) {
        console.log('Event: updateChat', data);

        $scope.messages.push({
            timestamp: new Date(),
            player: username,
            content: data
        });
        $scope.$apply();

        updateScroll();
    });


    /*
     * Game Events
     * These are events that are triggered by change of Game state (the game 
     * loop), or other Player actions.
     */
    socket.on('gameStatus', function(game) {
        console.log('Event: gameStatus', game);

        $scope.client.game = game;

        console.log('Self Object: ', $scope.client);
    });

    socket.on('updateGamelist', function(games) {
        console.log('Event: updateGamelist', games);

        $scope.games = games;
        $scope.$apply();
    });

    socket.on('addGameToList', function(game) {
        console.log('Event: addGameToList', game);

        $scope.games.push(game);
        $scope.$apply();
    });


    /*
     * Player Events
     * These are events that are triggered by actions performed by other 
     * Players in the current game, or by the Game loop.
     */
    socket.on('playerStatus', function(player) {
        console.log('Event: playerStatus', player);

        $scope.client.player = player;

        console.log('Self Object: ', $scope.client);
    });

    socket.on('updatePlayerList', function(players) {
        console.log('Event: updatePlayerList', players);

        $scope.players = players;
        $scope.$apply();
    });

    socket.on('addPlayerToList', function(player) {
        console.log('Event: addPlayerToList', player);

        $scope.players.push(player);
        $scope.$apply();
    });

    socket.on('removePlayerFromList', function(player) {
        console.log('Event: removePlayerFromList', player);

        $scope.players = $scope.players.filter(function(item) {
            return item.id != player.id;
        });

    });


    /*
     * Round Events
     * These are events that are triggered by change of Game state (the game 
     * loop), or other Player actions.
     */
    socket.on('resetVotes', function() {
        console.log('Event: resetVotes');

        $scope.client.vote = false;
    });

    socket.on('voteStatus', function(target) {
        console.log('Event: resetVotes');

        if (target == false || target == undefined) {
            $scope.client.vote = false;
        }
    });


    /*
     * Player Actions
     * These are actions that can be performed by a connected client. Unlike 
     * the previous functions, these are actions, and not listeners for events.
     */
    $scope.sendChat = function() {
        // Check for private message
        if ($scope.client.game.current.state == 'STARTED' && $scope.message.charAt(0) == '@') {
                console.log('Command: sendChat Private Message: ', $scope.message);

                var playerName = $scope.message.split(' ')[0];
                playerName = playerName.substr(1);
                var message = $scope.message.split(' ').slice(1).join(' ');

                // Find specified Player object
                var playerObj = $scope.players.filter(function ( player ) {
                    return player.name == playerName;
                })[0];

                socket.emit('sendChat', message, playerObj.id);
        } else {
            console.log('Command: sendChat Public Message: ', $scope.message);

            socket.emit('sendChat', $scope.message);
            $scope.message = '';
        }
    };

    $scope.createGame = function() {
        console.log('Command: createGame');

        socket.emit('createGame');
    };

    $scope.startGame = function() {
        console.log('Command: startGame');

        socket.emit('startGame');
    };

    $scope.joinGame = function(id) {
        console.log('Command: joinGame');

        if (id != $scope.client.game.id) {
            socket.emit('joinGame', id);
        }
    };

    $scope.sendVote = function(targetID) {
        console.log('Command: sendVote');

        if (targetID != $scope.client.player.id && $scope.client.game.current.state == 'STARTED') {
            socket.emit('sendVote', targetID);
            $scope.client.vote = targetID;
        }
    };
});