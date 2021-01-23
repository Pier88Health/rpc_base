'use strict';

const LoadBalance = require("./loadBalance.js"),
    DEBUG = require('debug')('rpc_base');
class RRobinLoadBalance extends LoadBalance {
    constructor(options) {
        super(options);
        this._offset = 0;
    }

    select() {
        let size = this._weightMap.size,
            addressList = this._addressManager.addressList;
        this._offset = (this._offset + 1) % size;
        for(let count = size; count--; count >= 0) {
            let address = addressList[this._offset];
            if (this._weightMap.get(address) > 0) {
                DEBUG(`RR LoadBalance select address ${address}`);
                return address;
            }
            this._offset = (this._offset + 1) % size;
        }
        return null;
    }

}

module.exports = RRobinLoadBalance;