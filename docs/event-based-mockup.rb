# This is using Ruby, because the syntax highlighting works to my advantage ever so slightly.
# This is not implementing callbacks as I thought of it afterwards.

SOCKET EVENT LISTENERS
    // Called by connection of new socket
    socket.join($socket)
        -> Emits: [
            event.newSocket($socket)
        ]

    // Called by creation of new game
    socket.createGame()
        -> Emits: [
            event.createGame()
        ]


SOCKET EVENT EMITS
    socket.playerRegistered({ player })
    socket.gameCreated({{ game }})


NODE EVENT LISTENERS
     listen.newSocket($socket)
        -> Calls: [
            player.register($socket)
        ]
        -> Emits: [
            event.newPlayer($player)
        ]


    listen.newPlayer($player)
        -> Calls: [
            game.register('Lobby', $player)
        ]
        -> Emits: [
            socket.game.playersJoined({{ newGame }}, {{ player }})
            socket.initializePlayer($game)
            socket.game.playersJoined({ newGame }, [ players ])
        ]


    listen.createGame()
        -> Calls: [
            game.create({ options })                                                // Create the new game in the database
        ]
        -> Emits: [
            socket.all.gameCreated({{ game }})                                      // Notify all players of the new game
            event.changeGame([ players ])                                           // Trigger change game for players
        ]


    listen.changeGame([ players ] , { newGame }, { oldGame })
        -> Calls: [
            game.removePlayers({ oldGame }, [ players ])                            // Remove the players from their old game
                -> Calls: [
                    game.addPlayers({ newGame }, [ players ])                       // Add the removed players to the new game
                ]
                -> Emits: [
                    socket.game.playersLeft({ oldGame }, [ players ])               // Notify other players in the old game of departures
                    socket.game.playersJoined({ newGame }, [ players ])             // Notify other players in the new game of arrivals
                    socket.game.selfGame({ newGame })                               // Notify each player of their new game
                ]
        ]


NODE EVENT EMITS
    event.newPlayer($player)
    event.newSocket($socket)


[ ]     - Array
{ }     - Object
{{ }}   - Stripped Object
$       - ID
