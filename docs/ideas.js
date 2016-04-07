import Core from Core;
import Container from Container;
import EventManagerModule from Event;
import SocketIO from socket.io
import SocketServiceModule from Socket;
import MessageServiceModule from Message;
import PlayerServiceModule from Player;
import GameServerModule from Game;

// core.js
class Core {
  constructor() {
    this.bootstrapped = false;
    this.container = new Container();

    this.container.register('Core', this);

    this.bootstrap();
  }

  bootstrap() {
    let modules = this.registerModules();

    for (let klass of this.modules) {
      let module = this.container.resolve(module);
      this.modules[module.getName()] = module;
    }
  }

  getContainer() {
    return this.container;
  }
}

// event.js
class EventManager {
  constructor() {
    this.listeners = [];
  }

  registerListener(event, listener) {
    this.listeners.push({
      event: event,
      listener: listener
    });
  }

  fireEvent(event) {
    for (let listener in this.listeners) {
      if (listener.event == event.name) {
        listener.listener(event);
      }
    }
  }
}

class EventManagerModule extends Module {
  constructor(Core) {
    let container = Core.getContainer();

    container.register('EventManager', => {
      return new EventManager();
    })
  }

  getName() {
    return "event_manager_module";
  }
}

// socket.js
class SocketService {
  constructor(SocketIO, EventManager) {
    this.socket = socketIO;
    this.eventManager = EventManager;

    this.socket.on('*', function (payload) {
      this.eventManager.fireEvent({
        name: `socket.${payload.name}`,
        payload: payload
      });
    })
  }

  send(message) {
    this.socket.send(message);
  }
}

class SocketServiceModule extends Module {
  constructor(Core) {
    let container = Core.getContainer();

    container.register('SocketService', => {
      return container.resolve(SocketService);
    })
  }

  getName() {
    return "socket_service_module";
  }
}

// game.js
class Game {
  constructor(name, owner, Room, Ballot) {
    this.name = name;
    this.owner = owner;
    this.players = [];
    this.rounds = [];
    this.ballot = Ballot;
    this.room = Room;
  }

  addPlayer(player) {
    this.players.push(player);
  }

  removePlayer(player) {
    // ..
  }

  addVote(player, votee) {
    this.players[player.id].votes.push(votee);
  }

  getName() {
    return this.name;
  }
}

class GameService {
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

class GameServiceModule extends Module {
  constructor(Core, SocketService, EventManager) {
    this.socket = SocketService;
    this.eventManager = EventManager;

    let container = Core.getContainer();
    let em = EventManager;

    container.register('GameFactory', (RoomService, BallotService) => {
      return {
        new: function (name) {
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

// app.js
class AppCore extends Core {
  registerModules() {
    return [
      EventManagerModule,
      MessageServiceModule,
      PlayerServiceModule,
      GameServerModule,
    ];
  }
}

const core = new Core();
