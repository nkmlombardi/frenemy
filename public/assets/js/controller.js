var socket = io.connect('http://localhost:8080');

angular.module('app', [])
   .controller('MainController', function($scope) {


/*
 * Client Side Collections
 * These collections contain pointers in the form of ID's to objects on
 * the server side to be referenced.
 */
    $scope.gamelist = [];
    $scope.game = false;
    $scope.player = false;
    $scope.vote = false;



/*
 * Keep the scroll position at the bottom of the page
 */
    function updateScroll() {
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

        // Reset scope variables on socket refresh
        $scope.gamelist = [];
        $scope.game = false;
        $scope.player = false;
        $scope.vote = false;

        socket.emit('playerLogin');
    });



/*
    Self Updating Events
    These updates pertain to the Client's Player object. Any information
    that is receieved only pertains to the Client and no one else.
 */
    /**
     * Update a Client's Player object
     * @param {object}      player
     *     @param {string}      player.id
     *     @param {string}      player.name
     *     @param {string}      player.socketID
     */
    socket.on('updatePlayer', function(player) {
        console.log('Event: updatePlayer', player);

        $scope.player = player;
        $scope.$apply();
    });

    /**
     * Update a Client's Game object
     * @param {object}      game
     */
    socket.on('updateGame', function(game) {
        console.log('Event: updateGame', game);

        $scope.game = game;
        $scope.$apply();
    });

        /**
         * Update a Client's Game's Status
         * @param {array}       game
         */
        socket.on('updateGameState', function(state) {
            console.log('Event: updateGameState', state);

            $scope.game.current.state = state;
            $scope.$apply();
        });

        /**
         * Update a Client's Game's Winners
         * @param {array}       winners
         * @param {object}      player
         *     @param {string}      player.id
         *     @param {string}      player.name
         */
        socket.on('updateGameWinners', function(winners) {
            console.log('Event: updateGameWinners', winners);

            $scope.game.winners = winners;
            $scope.$apply();
        });

        /**
         * Update a Client's Game's Losers
         * @param {array}       losers
         * @param {object}      player
         *     @param {string}      player.id
         *     @param {string}      player.name
         */
        socket.on('addGameLoser', function(loser) {
            console.log('Event: addGameLoser', loser);

            $scope.game.losers.push(loser);
            $scope.$apply();
        });


    /**
     * Changes the Client's Player's vote target
     * @param {string}     target
     */
    socket.on('updateVote', function(target) {
        console.log('Event: updateVote', target);

        $scope.vote = target;
        $scope.$apply();
    });



/*
    Client GameList Events
    These updates pertain to the list of Game objects that are available for the
    Client to join.
 */
    /**
     * Update a Client's GameList
     * @param {array}     games
     *     @param {object}     game
     *     @param {string}     game.id
     *     @param {string}     game.name
     */
    socket.on('updateGamelist', function(games) {
        console.log('Event: updateGamelist', games);

        $scope.gamelist = games;
        $scope.$apply();
    });

        /**
         * Add a Game object to the Client's GameList
         * @param {object}     game
         * @param {string}     game.id
         * @param {string}     game.name
         */
        socket.on('addGame', function(game) {
            console.log('Event: addGame', game);

            $scope.gamelist.push(game);
            $scope.$apply();
        });



/*
    Client Game Object Events
    These updates pertain to the current Game object that the Client is
    associated with.
 */
    /**
     * Updates all of the entries in the Clientside Game's MessageList
     * @param {array}     messages
     *     @param {object}     message
     *     @param {string}     message.id
     *     @param {string}     message.playerID
     *     @param {string}     message.content
     */
    socket.on('updateGameMessages', function(messages) {
        console.log('Event: updateGameMessages', messages);

        $scope.game.messages = messages;
        $scope.$apply();
        updateScroll();
    });

        /**
         * Adds a Message object to the MessageList
         * @param {object}     message
         * @param {string}     message.id
         * @param {string}     message.playerID
         * @param {string}     message.content
         */
        socket.on('addMessage', function(message) {
            console.log('Event: addMessage', message);

            $scope.game.messages.push(message);
            $scope.$apply();
            updateScroll();
        });


    /**
     * Updates all of the entries in the Clientside Game's PlayerList
     * @param {array}     players
     *     @param {object}     player
     *     @param {string}     player.id
     *     @param {string}     player.name
     */
    socket.on('updateGamePlayers', function(players) {
        console.log('Event: updateGamePlayers', players);

        // Add Player based on Game.state
        if ($scope.game.current.state === $scope.game.states.created) {
            $scope.game.players = players;
        } else if ($scope.game.current.state === $scope.game.states.playing) {
            $scope.game.current.players = players;
        } else {
            console.log('Game.current.state prevents the updating of the Game PlayerList.');
        }

        $scope.$apply();
    });

        /**
         * Adds a Player object to the PlayerList
         * @param {object}     player
         * @param {string}     player.id
         * @param {string}     player.name
         */
        socket.on('addPlayer', function(player) {
            console.log('Event: addPlayer', player);

            // Add Player based on Game.state
            if ($scope.game.current.state === $scope.game.states.created) {
                $scope.game.players.push(player);
            } else if ($scope.game.current.state === $scope.game.states.playing) {
                $scope.game.current.players.push(player);
            } else {
                console.log('Game.current.state prevents the updating of the Game PlayerList.');
            }

            $scope.$apply();
        });

        /**
         * Removes a Player object to the PlayerList
         * @param {object}     player
         * @param {string}     player.id
         * @param {string}     player.name
         */
        socket.on('removePlayer', function(player) {
            console.log('Event: removePlayer', player);

            // Add Player based on Game.state
            if ($scope.game.current.state === $scope.game.states.created) {
                $scope.game.players = $scope.game.players.filter(function(item) {
                    return item.id != player.id;
                });
            } else if ($scope.game.current.state === $scope.game.states.playing) {
                $scope.game.current.players = $scope.game.current.players.filter(function(item) {
                    return item.id != player.id;
                });
                $scope.game.losers.push(player);
            } else {
                console.log('Game.current.state prevents the updating of the Game PlayerList.');
            }

            $scope.$apply();
        });



/*
 * Player Actions
 * These are actions that can be performed by a connected client. Unlike
 * the previous functions, these are actions, and not listeners for events.
 */
    $scope.sendChat = function() {
        // Check for private message
        if ($scope.game.current.state == $scope.game.states.playing && $scope.message.charAt(0) == '@') {
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

        if (id != $scope.game.id) {
            socket.emit('joinGame', id);
        }
    };

    $scope.sendVote = function(targetID) {
        console.log('Command: sendVote', targetID);

        if (targetID != $scope.player.id && $scope.game.current.state === $scope.game.states.playing) {
            socket.emit('sendVote', targetID);
            // $scope.vote = targetID;
        }
    };
});
