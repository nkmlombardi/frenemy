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
