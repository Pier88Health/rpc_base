const {EventEmitter} = require('events'),
    assert = require('assert'),
    DEBUG = require('debug')('rpc_base')
    DEFAULT_WEIGHT = 1,
    MAX_WAIT_TIME = 3000;

class AddressManager extends EventEmitter {
    constructor(options = {}) {
        assert(options.key, '[AddressManager] options.key is required');
        super();
        this._key = options.key;
        this._inited = false;
        this._closed = false;
        this._addressList = null; // 地址列表
        this._weightMap = new Map(); // <host, weight>
        this._ready = false;
    }

    _selectAddress() {
        if (this._weightMap.size === 0) {
            return null;
        }
        for (let entry of this._weightMap.entries()) {
            if (entry[1] > 0) {
                DEBUG(`address select ==> ${this._key} ${entry}`);
                return entry[0];
            }
        }
        return null;
    }

    get key() {
        return this._key;
    }

    get addressList() {
        return this._addressList;
    }

    set addressList(val) {
        this._addressList = val;
        const newWeightMap = new Map();
        for (const address of this._addressList) {
            newWeightMap.set(address, this._weightMap.has(address)
                ? this._weightMap.get(address)
                : DEFAULT_WEIGHT);
        }
        this._weightMap = newWeightMap;
        this._ready = true;
    }

    select() {
        return this._selectAddress();
    }

    ready() {
        if (this._ready) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            let waitTime = 0,
                inverval = setInterval(() => {
                    if (this._ready) {
                        resolve();
                        clearInterval(inverval);

                    }
                    waitTime += 100;
                    if (waitTime > MAX_WAIT_TIME) {
                        console.log(`${this._key} addressManager has not been ready after ${MAX_WAIT_TIME} milliseconds`);
                        clearInterval(inverval);
                        resolve();
                    }
                }, 50);
        });
    }
}

module.exports = AddressManager;