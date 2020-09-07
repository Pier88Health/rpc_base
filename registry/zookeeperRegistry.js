const assert = require('assert'),
    zookeeper = require('zookeeper-cluster-client'),
    urlencode = require("urlencode"),
    CreateMode = zookeeper.CreateMode,
    RegistryBase = require("./base.js");

function buildKey(config) {
    return `${config.namespace}.${config.serviceName}`;
}

function buildServicePath(config) {
    return this.rootPath + `${config.namespace}.${config.serviceName}` + '/addresses';
}

function buildConsumerPath(config) {
    return this.rootPath + `${config.namespace}.${config.serviceName}` + '/consumers';
}

class ZookeeperRegistry extends RegistryBase {
    constructor(options = {}) {
        assert(options.address, '[ZooKeeperRegistry] options.address is required');
        super();
        this.options = options;
        this.rootPath = '/rpc/'
        this.subscribeMap = new Map(); // <interfaceName, addressList>
        this.registerMap = new Map();
        this._init();
    }

    _init() {
        this.zookeeperClient = zookeeper.createClient(this.options.address);
        this.zookeeperClient.on('connected', () => {
            this.emit('connected');
            this._reRegister();
        });
        this.zookeeperClient.on('disconnected', () => {
            this.emit('disconnected');
        });
        this.zookeeperClient.on('error', err => {
            this.emit('error', err);
        });
    }

    async _remove(path) {
        try {
            await this.zookeeperClient.remove(path);
        } catch (err) {
            if (err.name === 'NO_NODE' && err.code === -101) {
                return;
            }
            throw err;
        }
    }

    async _subscribe(config, listener) {
        assert(config && config.serviceName, config.namespace, '[ZookeeperRegistry] register(config) config.serviceName and config.namespace is required');
        const serviceKey = buildKey(config);

        if (!this._subscribeMap.has(serviceKey)) {
            this._subscribeMap.set(serviceKey, null);
            const servicePath = this._buildProviderPath(config);
            await this.zookeeperClient.mkdirp(servicePath)
            this.zookeeperClient.watchChildren(servicePath, (err, children) => {
                if (err) {
                    this.emit('error', err);
                    return;
                }
                const addressList = children.map(url => urlencode.decode(url));
                this._subscribeMap.set(serviceKey, addressList);
                this.emit(serviceKey, addressList);
            });

            const consumerPath = buildConsumerPath(config);
            const consumerUrl = `rpc://pid=${process.pid}&time=${Date.now()}`;
            const path = consumerPath + '/' + urlencode.encode(consumerUrl);
            this._zkClient.mkdirp(consumerPath)
                .then(() => {
                    return this._zkClient.create(path, EMPTY, CreateMode.EPHEMERAL);
                })
                .catch(err => {
                    console.warn('[ZookeeperRegistry] create consumerPath: %s failed, caused by %s', path, err.message);
                });
        } else {
            const addressList = this._subscribeMap.get(serviceKey);
            if (addressList) {
                setImmediate(() => { listener(addressList); });
            }
        }
        this.on(serviceKey, listener);
    }

    _unSubscribe(config, listener) {
        assert(config && config.serviceName, config.namespace, '[ZookeeperRegistry] register(config) config.serviceName and config.namespace is required');
        const serviceKey = buildKey(config);
        if (listener) {
            this.removeListener(serviceKey, listener);
        } else {
            this.removeAllListeners(serviceKey);
        }
        if (this.listenerCount(serviceKey) === 0) {
            this._subscribeMap.delete(serviceKey);
        }
    }

    async _register(config) {
        assert(config && config.serviceName, config.namespace, '[ZookeeperRegistry] register(config) config.serviceName and config.namespace is required');
        assert(config.address, '[RedisRegistry] register(config) config.host is required');
        const servicePath = buildServicePath(config);
        const path = servicePath + "/" + urlencode.encode(config.address);
        await this.zookeeperClient.mkdirp(servicePath);
        this.registerMap.set(path, config.address);
        try {
            if (await this.zookeeperClient.exists(path)) {
                await this._remove(path);
            }
            await this.zookeeperClient.create(path, EMPTY, CreateMode.EPHEMERAL);
        } catch (err) {
            throw err;
        }
    }

    async _unRegister(config) {
        assert(config && config.serviceName, config.namespace, '[ZookeeperRegistry] register(config) config.serviceName and config.namespace is required');
        assert(config.address, '[RedisRegistry] register(config) config.host is required');
        const servicePath = buildServicePath(config),
            path = servicePath + "/" + urlencode.encode(config.address);
        this.registerMap.delete(path, config.address);
        await this._remove(path);
    }
}

module.exports = ZookeeperRegistry;