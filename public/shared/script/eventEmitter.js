export class EventEmitter {
    constructor() {
        this.events = {};
    };

    on(event, handler) {
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(handler);
    };

    emit(event, data) {
        if (!this.events[event]) return;
        for (const handler of this.events[event]) {
            handler(data);
        }
    };

    off(event, handler) {
        if (!this.events[event]) return;
        this.events[event] = this.events[event].filter(h => h !== handler);
    };
};