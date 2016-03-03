var socket = io.connect('http://localhost:8080');

angular.module('app', [])
   .controller('MainController', function($scope) {

    // Controller Object Lists
    $scope.games = [];
    $scope.rooms = [];
    $scope.players = [];
    $scope.messages = [];

    $scope.current = {
        room: {},
        game: false,
        player: {}
    };


    // Socket Listeners
    socket.on('connect', function() {
        $scope.messages = [];
        socket.emit('adduser', 'USERNAME');
    });

    socket.on('updatechat', function(username, data) {
        console.log('Event: updatechat', data);

        $scope.messages.push({
            timestamp: new Date(),
            player: username,
            content: data
        });
        $scope.$apply();
    });

    socket.on('updateGamelist', function(rooms, player_room) {
        console.log('Event: updateGamelist', rooms);

        $scope.rooms = rooms;
        $scope.current.room = player_room;
        $scope.$apply();
    });

    socket.on('addGamesToGamelist', function(rooms) {
        console.log('Event: addGamesToGamelist', rooms);

        $.each(rooms, function(key, room) {
            $scope.rooms.push(room);
        });
        $scope.$apply();
    });

    socket.on('updatePlayerlist', function(players, self) {
        console.log('Event: updatePlayerList', players);

        $scope.players = players;
        $scope.current.player = self;
        $scope.$apply();
    });

    socket.on('addPlayersToPlayerlist', function(players) {
        console.log('Event: addPlayersToPlayerlist', players);

        $.each(players, function(key, player) {
            $scope.players.push(player);
        });
        $scope.$apply();
    });


    // Browser Actions
    $scope.sendChat = function() {
        console.log('Event: sendChat', $scope.message);

        socket.emit('sendchat', $scope.message);
        $scope.message = '';
    };
});