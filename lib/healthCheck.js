'use strict';
const health = require("grpc-health-check"),
    DEBUG = require('debug')('rpc_base'),
    ServingStatus = health.messages.HealthCheckResponse.ServingStatus;

class HealthCheck {
    constructor() {
        this._clientCache = new Map();
        this.request = new health.messages.HealthCheckRequest();
    }

    async checkAsync(address) {
        let client;
        if (!this._clientCache.has(address)) {
            this._clientCache.set(address, new health.Client(address, grpc.credentials.createInsecure()));
        } 
        client = this._clientCache.get(address);
        return new Promise((resolve) => {
            client.check(this.request, function(err, response) {
                if(!err && response.getStatus() === ServingStatus.SERVING) {
                    DEBUG(`HealthCheck check address ${address} true`);
                    resolve(true);
                    return;
                }
                DEBUG(`HealthCheck check address ${address} false`);
                resolve(false);
            });
        }); 
    }

    check(address, callback) {
        let client;
        if (!this._clientCache.has(address)) {
            this._clientCache.set(address, new health.Client(address, grpc.credentials.createInsecure()));
        } 
        client = this._clientCache.get(address);
        client.check(this.request, function(err, response) {
            if(!err && response.getStatus() === ServingStatus.SERVING) {
                DEBUG(`HealthCheck check address ${address} true`);
                return callback(null, true);
            }
            DEBUG(`HealthCheck check address ${address} false`);
            return callback(null, false);
        });
    }
}
module.exports = {
    get instance() {
        if (!this._instance) {
            this._instance = new HealthCheck();
        }
        return this._instance;
    }
}