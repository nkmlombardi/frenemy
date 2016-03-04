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
    $scope.self = {
        game: false,
        player: false
    };


    /*
     * Connection Events
     * These are events that are triggered by new clients connecting to the 
     * Frenemy server.
     */
    socket.on('connect', function() {
        console.log('Event: connect');

        $scope.messages = [];
        socket.emit('playerLogin');

        console.log(socket);
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
    });


    /*
     * Game Events
     * These are events that are triggered by change of Game state (the game 
     * loop), or other Player actions.
     */
    socket.on('gameStatus', function(game) {
        console.log('Event: gameStatus', game);

        $scope.self.game = game;

        console.log('Self Object: ', $scope.self);
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

    socket.on('addGamesToList', function(games) {
        console.log('Event: addGamesToList', games);

        $.each(games, function(key, game) {
            $scope.games.push(game);
        });
        $scope.$apply();
    });


    /*
     * Player Events
     * These are events that are triggered by actions performed by other 
     * Players in the current game, or by the Game loop.
     */

    socket.on('playerStatus', function(player) {
        console.log('Event: playerStatus', player);

        $scope.self.player = player;

        console.log('Self Object: ', $scope.self);
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

    socket.on('addPlayersToList', function(players) {
        console.log('Event: addPlayersToList', players);

        $.each(players, function(key, player) {
            $scope.players.push(player);
        });
        $scope.$apply();
    });

    socket.on('removePlayerFromList', function(player) {
        console.log('Event: removePlayersFromList', player);

        var index = $scope.players.indexOf(player);
        $scope.players.splice(index, 1);
    });

    socket.on('removePlayersFromList', function(players) {
        console.log('Event: removePlayersFromList', players);

        $.each(players, function(key, player) {
            var index = $scope.players.indexOf(player);
            $scope.players.splice(index, 1);
        });
    });


    /*
     * Player Actions
     * These are actions that can be performed by a connected client. Unlike 
     * the previous functions, these are actions, and not listeners for events.
     */
    $scope.sendChat = function() {
        console.log('Command: sendChat', $scope.message);

        socket.emit('sendChat', $scope.message);
        $scope.message = '';
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

        if (id != $scope.self.game.id) {
            socket.emit('joinGame', id);
        }
    };
});