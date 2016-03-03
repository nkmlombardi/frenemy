var socket = io.connect('http://localhost:8080');

angular.module('app', [])
   .controller('MainController', function($scope) {

    // Controller Object Lists
    $scope.games = [];
    $scope.players = [];
    $scope.messages = [];

    // Varibles about the Player
    $scope.self = {
        game: false,
        player: false
    };


    // Socket Listeners
    socket.on('connect', function() {
        console.log('Event: connect');

        $scope.messages = [];
        socket.emit('playerLogin');
    });

    // Persisted Socket's status to front end
    socket.on('playerStatus', function(status) {
        console.log('Event: playerStatus', status);

        // Assign properties
        if (_.has(status, 'player')) {
            $scope.self.player = status.player;
        }

        if (_.has(status, 'game')) {
            $scope.self.game = status.game;
        }

        console.log('Self Object: ', $scope.self);
    });

    socket.on('updateChat', function(username, data) {
        console.log('Event: updateChat', data);

        $scope.messages.push({
            timestamp: new Date(),
            player: username,
            content: data
        });
        $scope.$apply();
    });

    socket.on('updateGamelist', function(games) {
        console.log('Event: updateGamelist', games);

        $scope.games = games;
        $scope.$apply();
    });

    socket.on('addGamesToList', function(games) {
        console.log('Event: addGamesToList', games);

        $.each(games, function(key, game) {
            $scope.games.push(game);
        });
        $scope.$apply();
    });

    socket.on('updatePlayerList', function(players) {
        console.log('Event: updatePlayerList', players);

        $scope.players = players;
        $scope.$apply();
    });

    socket.on('addPlayersToList', function(players) {
        console.log('Event: addPlayersToList', players);

        $.each(players, function(key, player) {
            $scope.players.push(player);
        });
        $scope.$apply();
    });

    socket.on('removePlayersFromList', function(players) {
        console.log('Event: removePlayersFromList', players);

        $.each(players, function(key, player) {
            var index = $scope.players.indexOf(player);
            $scope.players.splice(index, 1);
        });
    });

    socket.on('gameStatus', function(game) {
        console.log('Event: gameStatus', game);

        $scope.self.game = game;
    });


    // Browser Actions
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

        socket.emit('joinGame', id);
    };
});