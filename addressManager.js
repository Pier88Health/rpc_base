const {EventEmitter} = require('events'),
    assert = require('assert'),
    HealthClient = require("./lib/health"),
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
        let length = this._addressList.length;
        let ready = true;
        let count = 0;
        for (const address of this._addressList) {
            HealthClient.instance.check(address, (weight) => {
                newWeightMap.set(address, weight);
                count++;
                if (count === length) {
                    ready = true
                }
            });
        }
        this._weightMap = newWeightMap;
        this._ready = ready;
    }

    async select() {
        return this._selectAddress();
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