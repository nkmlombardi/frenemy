angular.module('app', [])
   .controller('MainController', function($scope) {
        $scope.greeting = "Hello World";
        $scope.games = [];
        $scope.rooms = [];

        socket.on('connect', function() {
            socket.emit('adduser', 'USERNAME');
        });

        socket.on('updateGamelist', function(rooms, player_room) {
            console.log('Event: updateGamelist', rooms);

            $scope.rooms = rooms;
            $scope.player_room = player_room;
        });

        socket.on('addGamesToGamelist', function(rooms) {
            console.log('Event: addGamesToGamelist', rooms);

            $.each(rooms, function(key, room) {
                $scope.rooms.push(room);
            });
        });
});