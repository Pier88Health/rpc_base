const assert = require('assert'),
    redis = require('redis'),
    {promisify} = require('util'),
    RegistryBase = require("./base.js");

function buildKey(config) {
    return `${config.serviceName}@P88Health`;
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
        this._subscribeMap = new Map(); // <interfaceName, addressList>
        this._registerMap = new Map();
        this._init();
    }

    _init() {
        this.redisClient = redis.createClient(this.options.port, this.options.host);
        this.subClient = redis.createClient(this.options.port, this.options.host);
        this.redisClient.on('ready', () => {
            this._ready = true;
        });
        this.redisClient.smembersAsync = promisify(this.redisClient.smembers).bind(this.redisClient);
    }

    async _subscribe(config, listener) {
        assert(config && config.serviceName, '[ConfigRegistry] subscribe(config, listener) config.ServiceName is required');
        const serviceName = config.serviceName,
            key = buildKey(config);
        let addressList;
        if (this._subscribeMap.has(serviceName)) {
            addressList = this._subscribeMap.get(serviceName);
            this.emit(serviceName, addressList);
            return;
        }
        addressList = await this.redisClient.smembersAsync(key);
        if (Array.isArray(addressList)) {
            this._subscribeMap.set(serviceName, addressList);
            listener(addressList);
        }
        this.subClient.subscribe(key);
        this.subClient.on("message", async (channel, message) => {
            addressList = await this.redisClient.smembersAsync(key);
            if (Array.isArray(addressList)) {
                this._subscribeMap.set(serviceName, addressList);
                this.emit(serviceName, addressList);
            }
            console.log(`${channel} add or remove service provider "${message}"`);
        });
        this.on(serviceName, listener);
    }

    _unSubscribe(config, listener) {
        assert(config && config.serviceName, '[ConfigRegistry] unSubscribe(config, listener) config.serviceName is required');
        const interfaceName = config.interfaceName;
        if (listener) {
            this.removeListener(interfaceName, listener);
        } else {
            this.removeAllListeners(interfaceName);
        }
        if (this.listenerCount(interfaceName) === 0) {
            this._subscribeMap.delete(interfaceName);
        }
    }

    _register(config) {
        assert(config && config.serviceName, '[RedisRegistry] register(config) config.serviceName is required');
        assert(config.address, '[RedisRegistry] register(config) config.host is required');
        let key = buildKey(config);
        this._registerMap.set(`${config.serviceName}@${config.address}`, config.address);
        this.redisClient.sadd(key, config.address);
        this.redisClient.publish(key, config.address);
    }

    _unRegister(config) {
        assert(config && config.serviceName, '[ConfigRegistry] register(config) config.serviceName is required');
        assert(config.address, '[configRegistry] register(config) config.host is required');
        let key = buildKey(config);
        this._registerMap.delete(`${config.serviceName}@${config.address}`);
        this.redisClient.srem(key, config.address);
        this.redisClient.publish(key, config.address);
    }
}

module.exports = RedisRegistry;