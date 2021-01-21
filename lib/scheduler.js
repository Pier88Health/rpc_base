'use strict';

const {EventEmitter} = require('events');

class Scheduler extends EventEmitter {
    constructor() {
        super();
        this._cache = new Map();
        this.setMaxListeners(0);
    }

    interval(fn, ms) {
        assert(typeof fn === 'function', "Shedule#interval fn must be function");
        assert(typeof ms === 'number', "Shedule#interval ms must be number");
        let eventName = `Timer#${ms}`,
            timerId;
        if (!this._cache.has(ms)) {
            timerId = setInterval(() => {
                this.emit(eventName);
            }, ms);
            this._cache.set(ms, timerId);
        }
        this.on(eventName, fn);
    }

    deleteListener(ms, fn) {
        let eventName = `Timer#${ms}`,
            timerId;
        this.removeListener(eventName, fn);
        if (this.listenerCount(eventName) === 0) {
            timerId = this._cache.get(ms);
            clearInterval(timerId);
            this._cache.delete(ms);
        }
    }

    clear() {
        for(let timerId of this._cache.values()) {
            clearInterval(timerId);
        }
        this._cache.clear();
        this.removeAllListeners();
      }
}

module.exports = {
    get instance() {
        if (!this._instance) {
            this._instance = new Scheduler();
        }
        return this._instance;
    }
}