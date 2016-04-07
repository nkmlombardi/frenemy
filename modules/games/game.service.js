import Service from '../service';

class GameService extends Service {
    constructor(EventManager, PlayerService, GameFactory) {
        this.eventManager = EventManager;
        this.playerService = PlayerService;
        this.gameFactory = GameFactory;
        this.games = [];

        let em = this.eventManager;

        em.registerListener('socket.player.create_game', this.onCreateGame);
        em.registerListener('socket.player.join', this.onPlayerJoin);
        em.registerListener('socket.player.leave', this.onPlayerLeave);
    }

    onCreateGame(event) {
        var player = this.playerService.find(event.player.id);

        if (player.canCreateGame()) {
            this.games.push(this.gameFactory.new(player, event.game.name));
        }
    }

    onPlayerJoin(event) {
        var player = this.playerService.find(event.player.id);

        if (player.canJoinGame()) {
            this.games[event.game.id].addPlayer(player);
            this.eventManager.fireEvent({
                name: "game.player_join",
                player: player,
                game: event.game.id,
            });
        }
    }

    onPlayerLeave(event) {
        var player = this.playerService.find(event.player.id);

        this.games[event.game.id].removePlayer(player);
        this.eventManager.fireEvent({
            name: "game.player_leave",
            player: player,
            game: event.game.id,
        });
    }
}
