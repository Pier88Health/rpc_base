'use strict';
const assert = require('assert');
class LoadBalance {
    constructor(options) {
        assert(options.addressManager, "[LoadBalance] options.addressManager is required");
        this._addressManager = options.addressManager;
        this._weightMap = options.addressManager.weightMap;
    }

    select() {
        let size = this._weightMap.size,
            addressList = this._addressManager.addressList;
        if (size > 0) {
            return addressList[0]
        }
        return null;
    }
}

module.exports = LoadBalance;