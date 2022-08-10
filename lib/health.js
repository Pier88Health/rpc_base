'use strict';
const health = require('grpc-health-check');
const grpc = require('grpc');
const assert = require('assert');
const timer = require('./timer').instance;
const health_messages = health.messages;
const ServingStatus = health_messages.HealthCheckResponse.ServingStatus;

class HealthClient {
    constructor(options = {}) {
        this.clientMap = {};
        this.request = new health_messages.HealthCheckRequest();
        this.WeigthMap = {};
    }

   getClient(address) {
        assert(address, '[HealthClient.getClient] params.address is required');
        let client = this.clientMap[address];
        if (!client) {
            client = new health.Client(address, grpc.credentials.createInsecure());
            this.clientMap[address] = client;
        }
        return client;
   }

   async check(address) {
        assert(address, '[HealthClient.check] params.address is required');
        let client = this.getClient(address);
        let request = this.request;
        let weightMap = this.WeigthMap;
        request.setService('Check');
        if (weightMap[address]) {
            return weightMap[address];
        }
        return new Promise(function (resolve) { 
            client.check(request, function(err, response) {
                if (err) {
                    weightMap[address] = 0;
                    console.error(`HealthClient#check Error ==> rpc server ${address} not available`);
                    return resolve(weightMap[address]);
                }
                if (response.getStatus() === ServingStatus.SERVING) {
                    weightMap[address] = 1;
                } else {
                    weightMap[address] = 0;
                }
                return resolve(weightMap[address]);
            });
        });
   }
}

const _instance = Symbol.for('HealthClient#instance');

module.exports = {
    get instance() {
        if (!this[_instance]) {
            this[_instance] = new HealthClient();
        }
        return this[_instance];
    }
}