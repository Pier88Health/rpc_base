const assert = require('assert'),
    redis = require('redis'),
    common = require("../lib/common.js"),
    {promisify} = require('util'),
    RegistryBase = require("./base.js");

function buildKey(config) {
    return common.BuildServiceKey(config.namespace, config.serviceName);
}

function buildServiceKey(config) {
    let serviceName = config.serviceName;
    if (serviceName.indexOf(".") === -1) {
        serviceName = buildKey(config);
    }
    return serviceName;
}
class RedisRegistry extends RegistryBase {
    constructor(options = {}) {
        assert(options.address, '[RedisRegistry] options.address is required');
        let host, port;
        [host, port] = options.address.split(':');
        options.host = host;
        options.port = port;
        assert(host && port, '[RedisRegistry] options.address must be "host:port"');
        super();
        this.options = options;
        this.subscribeMap = new Map(); // <interfaceName, addressList>
        this.registerMap = new Map();
        this._init();
    }

    _init() {
        this.redisClient = redis.createClient(this.options.port, this.options.host);
        this.subClient = redis.createClient(this.options.port, this.options.host);
        if (options.password) {
            this.redisClient.auth(options.password);
            this.subClient.auth(options.password);
        }
        this.redisClient.on('ready', () => {
            this._ready = true;
        });
        this.redisClient.smembersAsync = promisify(this.redisClient.smembers).bind(this.redisClient);
    }

    async _subscribe(config, listener) {
        assert(config && config.serviceName, '[ConfigRegistry] subscribe(config, listener) config.ServiceName is required');
        const serviceKey = buildServiceKey(config);
        let addressList;
        console.log(serviceKey);
        if (this.subscribeMap.has(serviceKey)) {
            addressList = this.subscribeMap.get(serviceKey);
            this.emit(serviceKey, addressList);
            return;
        }
        addressList = await this.redisClient.smembersAsync(serviceKey);
        if (Array.isArray(addressList)) {
            this.subscribeMap.set(serviceKey, addressList);
            listener(addressList);
        }
        this.subClient.subscribe(serviceKey);
        this.subClient.on("message", async (channel, message) => {
            addressList = await this.redisClient.smembersAsync(key);
            if (Array.isArray(addressList)) {
                this.subscribeMap.set(serviceKey, addressList);
                this.emit(serviceKey, addressList);
            }
            console.log(`${channel} add or remove service provider "${message}"`);
        });
        this.on(serviceKey, listener);
    }

    _unSubscribe(config, listener) {
        assert(config && config.serviceName, '[ConfigRegistry] unSubscribe(config, listener) config.serviceName is required');
        const serviceKey = buildServiceKey(config);
        if (listener) {
            this.removeListener(serviceKey, listener);
        } else {
            this.removeAllListeners(serviceKey);
        }
        if (this.listenerCount(serviceKey) === 0) {
            this.subscribeMap.delete(serviceKey);
        }
    }

    _register(config) {
        assert(config && config.serviceName, '[RedisRegistry] register(config) config.serviceName is required');
        assert(config.address, '[RedisRegistry] register(config) config.host is required');
        let key = buildKey(config);
        this.registerMap.set(key, config.address);
        this.redisClient.sadd(key, config.address);
        this.redisClient.publish(key, config.address);
    }

    _unRegister(config) {
        assert(config && config.serviceName, '[ConfigRegistry] register(config) config.serviceName is required');
        assert(config.address, '[configRegistry] register(config) config.host is required');
        let key = buildKey(config);
        this.registerMap.delete(key);
        this.redisClient.srem(key, config.address);
        this.redisClient.publish(key, config.address);
    }
}

module.exports = RedisRegistry;