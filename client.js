const AddressManager = require('./addressManager.js'),
    grpc = require('grpc'),
    assert = require('assert'),
    protoLoader = require('@grpc/proto-loader');
    // registry = new ConfigRegistry({address: __dirname + "/../rpc/registry/config.json"});
function buildClientKey(params) {
    return `${params.serviceName}@${params.host}`;
}

const defaultOptions = {
    protoFolder: __dirname + '/proto/'
}
class RpcClient {
    constructor(options = {}) {
        assert(options.registry, '[RpcClient] options.registry is required');
        this.options = Object.assign({}, defaultOptions, options);
        this.registry = options.registry;
        this.addressManagerMap = new Map();
        this.clientMap = {};
    }

    async getClient(namespace, serviceName) {
        let protoPath = this.options.protoFolder + namespace + "." + serviceName + '.proto',
            packageDefinition,
            proto,
            addressManager,
            address,
            clientKey,
            client;
        if (!this.addressManagerMap.has(serviceName)) {
            addressManager = new AddressManager({key: serviceName});
            this.addressManagerMap.set(serviceName, addressManager);
        } else {
            addressManager = this.addressManagerMap.get(serviceName);
        }
        this.registry.subscribe({serviceName: serviceName}, (addresses) => {
            addressManager.addressList = addresses;
        });
        await addressManager.ready();
        address = addressManager.select();
        if (!address) {
            return null;
        }
        clientKey = buildClientKey({ServiceName: serviceName, Host: address});
        client = this.clientMap[clientKey];
        if (client) {
            return client;
        }
        packageDefinition = protoLoader.loadSync(
            protoPath,
            {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true
            }
        );
        proto = grpc.loadPackageDefinition(packageDefinition)[serviceName];
        client = new proto[serviceName](address,
            grpc.credentials.createInsecure());
        this.clientMap[clientKey] = client;
        return client;
    }

    async invoke(params) {
        console.log(params);
        let client,
            namespace = params.namespace,
            serviceName = params.serviceName,
            methodName = params.methodName,
            request = params.request;
        assert(serviceName && methodName, '[RpcClient.invoke] params.serviceName and params.methodName is required');
        client = await this.getClient(namespace, serviceName);
        return new Promise(function (resolve, reject) {
            client[methodName](request, function (err, response) {
                if (err) {
                    return reject(err);
                }
                if (response.Error) {
                    return reject(response.Error);
                }
                resolve(response);
            });
        });
    }
}

module.exports = RpcClient;