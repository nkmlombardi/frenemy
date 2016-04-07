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
