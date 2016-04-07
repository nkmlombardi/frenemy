class SocketService {
    constructor(SocketIO, EventManager) {
        this.socket = socketIO;
        this.eventManager = EventManager;

        this.socket.on('*', function(payload) {
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
