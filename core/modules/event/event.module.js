class EventModule extends Module {
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