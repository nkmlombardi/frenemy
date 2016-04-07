/*
 * Frenemy Game Server
 * -------------------
 * Run this file using nodemon for best results. Listens for events from the
 * front end and performs actions on the various objects that control the flow
 * of a game.
 */

import Core from 'core/core';
import Container from 'core/container';
import EventManagerModule from Event;
import SocketIO from socket.io
import SocketServiceModule from Socket;
import MessageServiceModule from 'services/message';
import PlayerServiceModule from 'services/player';
import GameServerModule from Game;


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
