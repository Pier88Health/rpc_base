const assert = require('assert'),
    fs = require('fs'),
    RegistryBase = require("./base.js");

class ConfigRegistry extends RegistryBase {
    constructor(options = {}) {
        assert(options.address, '[ConfigRegistry] options.address is required');
        super();
        this.options = options;
        this.subscribeMap = new Map(); // <interfaceName, addressList>
        this.registerMap = new Map();
        this._init();
    }

    _init() {
        assert(fs.existsSync(this.options.address), `[ConfigRegistry] options.address: ${this.options.address} file not exists`);
        const configData = fs.readFileSync(this.options.address);
        this.subscribeMap = JSON.parse(configData);
    }

    _subscribe(config, listener) {
        assert(config && config.serviceName, '[ConfigRegistry] subscribe(config, listener) config.ServiceName is required');
        const serviceName = config.serviceName,
            address = this.subscribeMap[serviceName];
        if (address && address.length) {
            listener(address);
        }
        this.on(serviceName, listener);
        return address;
    }

    _unSubscribe(config, listener) {
        assert(config && config.serviceName, '[ConfigRegistry] unSubscribe(config, listener) config.serviceName is required');
        const serviceName = config.serviceName;

        if (listener) {
            this.removeListener(serviceName, listener);
        } else {
            this.removeAllListeners(serviceName);
        }
        if (this.listenerCount(serviceName) === 0) {
            this.subscribeMap.delete(serviceName);
        }
    }

    _register() {
    }

    _unregister() {
    }
}

module.exports = ConfigRegistry;