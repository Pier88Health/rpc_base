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
        DEBUG(`HealthCheck address ${address}`);
        if (!this._clientCache.has(address)) {
            this._clientCache.set(address, new health.Client(address, grpc.credentials.createInsecure()));
        } 
        client = this._clientCache.get(address);
        return new Promise((resolve) => {
            client.check(this.request, function(err, response) {
                if(!err && response.getStatus() === ServingStatus.SERVING) {
                    resolve(true);
                }
                resolve(false);
            });
        }); 
    }

    check(address, callback) {
        let client;
        DEBUG(`HealthCheck check address ${address}`);
        if (!this._clientCache.has(address)) {
            this._clientCache.set(address, new health.Client(address, grpc.credentials.createInsecure()));
        } 
        client = this._clientCache.get(address);
        client.check(this.request, function(err, response) {
            if(!err && response.getStatus() === ServingStatus.SERVING) {
                return callback(null, true);
            }
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