class SocketModule extends Module {
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
