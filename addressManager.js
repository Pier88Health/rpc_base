const {EventEmitter} = require('events'),
    assert = require('assert'),
    healthClient = require("./lib/health").instance,
    DEBUG = require('debug')('rpc_base')
    DEFAULT_WEIGHT = 1,
    MAX_WAIT_TIME = 15000;

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

    async select() {
        let address = this._selectAddress();
        if (!address) {
            return null;
        }
        let weight = await healthClient.check(address);
        if (!weight) {
            return null
        }
        return address;
    }

    ready() {
        if (this._ready) {
            return Promise.resolve();
        }
        return new Promise((resolve, reject) => {
            let waitTime = 0,
                inverval = setInterval(() => {
                    if (this._ready) {
                        clearInterval(inverval);
                        return resolve();
                    }
                    DEBUG("AddressManager#ready wait for ready");
                    if (waitTime > MAX_WAIT_TIME) {
                        clearInterval(inverval);
                        reject(`ERROR ==> ${this._key} addressManager has not been ready after ${MAX_WAIT_TIME} milliseconds`);
                    }
                }, 50);
        });
    }
}

module.exports = AddressManager;