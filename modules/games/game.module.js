import Module from '../module';

class GameModule extends Module {
    constructor(Core, SocketService, EventManager) {
        this.socket = SocketService;
        this.eventManager = EventManager;

        let container = Core.getContainer();
        let em = EventManager;

        container.register('GameFactory', (RoomService, BallotService) => {
            return {
                new: function(name) {
                    return new Game(name, RoomService.getRoom(), BallotService.getBallot());
                }
            };
        });

        container.register('GameService', => {
            return container.resolve(GameService);
        });
    }

    getName() {
        return "message_service_module";
    }
}
