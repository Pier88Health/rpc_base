'use strict';

const {EventEmitter} = require('events');

class RegistryBase extends EventEmitter {
    constructor(options = {}) {
        super();
        this.options = options || {};
        this._ready = false;
        this._closed = false;
    }

    async register(config) {
        return await this._register(config);
    }

    async unRegister(config) {
        return await this._unRegister(config);
    }

    subscribe(config, listener) {
        this._subscribe(config, listener);
    }

    unSubscribe(config, listener) {
        this._unSubscribe(config, listener);
    }

    close() {
        return this._close();
    }

    ready() {
        return new Promise((resolve, reject) => {
            if (this._ready) {
                return resolve();
            }
            return reject(new Error('Registry not ready'));
        });
    }
}

module.exports = RegistryBase;