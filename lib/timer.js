'use strict';

const assert = require('assert');
const { EventEmitter } = require('events');

class Timer extends EventEmitter {
    constructor() {
        super();
        this.timers = new Map();
        this.setMaxListeners(0);
    }

    buildEventName(period) {
        return `Timer#interval_${period}`;
    }

    setInterval(fn, period) {
        assert(typeof fn === "function", "Timer#setInterval params.fn must be function");
        assert(typeof period === "number", "Timer#setInterval params.period must be number");
        const eventName = this.buildEventName(period);
        if (!this.timers.has(period)) {
            const timerId = setInterval(() => {
                this.emit(eventName);
            }, period);
            this.timers.set(period, timerId);
        }
        this.on(eventName, fn);
    }

    remove(fn, period) {
        const eventName = this.buildEventName(period);
        this.removeListener(eventName, fn);
        if (this.listenerCount(eventName) === 0) {
            const timerId = this.timer.get(period);
            clearInterval(timerId);
            this.timers.delete(period);
        }
    }

    clear() {
        for (const timerId of this.timer.values()) {
            clearInterval(timerId);
        }
        this.timers.clear();
        this.removeAllListeners();
    }
}

const _instance = Symbol.for('Timer#instance');

module.exports = {
    get instance() {
        if (!this[_instance]) {
            this[_instance] = new Timer();
        }
        return this[_instance];
    }
};
