const assert = require('assert'),
    fs = require('fs'),
    RegistryBase = require("./base.js");

class ConfigRegistry extends RegistryBase {
    constructor(options = {}) {
        assert(options.address, '[ConfigRegistry] options.address is required');
        super();
        this.options = options;
        this._subscribeMap = new Map(); // <interfaceName, addressList>
        this._registerMap = new Map();
        this._init();
    }

    _init() {
        assert(fs.existsSync(this.options.address), `[ConfigRegistry] options.address: ${this.options.address} file not exists`);
        const configData = fs.readFileSync(this.options.address);
        this._subscribeMap = JSON.parse(configData);
        this._ready = true;
    }

    _subscribe(config, listener) {
        assert(config && config.serviceName, '[ConfigRegistry] subscribe(config, listener) config.ServiceName is required');
        const serviceName = config.serviceName,
            address = this._subscribeMap[serviceName];
        if (address && address.length) {
            listener(address);
        }
        this.on(serviceName, listener);
        return address;
    }

    unSubscribe(config, listener) {
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
        assert(config && config.serviceName, '[ConfigRegistry] register(config) config.serviceName is required');
        assert(config.host, '[ConfigRegistry] register(config) config.host is required');
        if (!this._registerMap.has(config.serviceName)) {
            this._registerMap.set(config.serviceName, [config.host]);
        }
    }

    _unregister(config) {
        assert(config && config.serviceName, '[ConfigRegistry] register(config) config.serviceName is required');
        assert(config.host, '[configRegistry] register(config) config.host is required');
        this._registerMap.delete(config.serviceName);
    }
}

module.exports = ConfigRegistry;