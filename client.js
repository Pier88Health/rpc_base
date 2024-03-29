const AddressManager = require('./addressManager.js'),
    DEBUG = require('debug')('rpc_base'),
    grpc = require('grpc'),
    assert = require('assert'),
    protoLoader = require('@grpc/proto-loader'),
    MAX_RETRY = 3,
    commom = require("./lib/common.js");
    // registry = new ConfigRegistry({address: __dirname + "/../rpc/registry/config.json"});
function buildClientKey(params) {
    return `${params.namespace}${params.serviceName}@${params.host}`;
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
        assert(namespace && serviceName, '[RpcClient.getClient] namespace and serviceName is required');
        let protoFileName = commom.BuildProtoFileName(namespace, serviceName),
            protoPath = commom.GetProtoFilePath(this.options.protoFolder, protoFileName),
            packageDefinition,
            serviceKey = commom.BuildServiceKey(namespace, serviceName),
            proto,
            addressManager,
            address,
            clientKey,
            client;
        if (!this.addressManagerMap.has(serviceKey)) {
            addressManager = new AddressManager({key: serviceKey});
            this.addressManagerMap.set(serviceKey, addressManager);
            this.registry.subscribe({serviceName: serviceKey}, (addresses) => {
                if (addresses.length) {
                    DEBUG(`address update ==> ${serviceKey} addresses: ${addresses}`);
                    addressManager.addressList = addresses;
                }
            });
            await addressManager.ready();
        } else {
            addressManager = this.addressManagerMap.get(serviceKey);
        }
        assert(protoPath, `${serviceName} proto file not found`);
        address = addressManager.select();
        if (!address) {
            return null;
        }
        clientKey = buildClientKey({namespace: namespace, serviceName: serviceName, host: address});
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
        DEBUG('RpcClient#getClient proto path ==> ', protoPath);
        proto = grpc.loadPackageDefinition(packageDefinition)[serviceName];
        client = new proto[serviceName](address,
            grpc.credentials.createInsecure());
        this.clientMap[clientKey] = client;
        return client;
    }

    async invoke(params) {
        let client,
            namespace = params.namespace,
            serviceName = params.serviceName,
            methodName = params.methodName,
            request = params.request;
        assert(serviceName && methodName, '[RpcClient.invoke] params.serviceName and params.methodName is required');
        DEBUG(`call ==> ${namespace}#${serviceName}.${methodName} ${JSON.stringify(request)}`);
        client = await this.getClient(namespace, serviceName);
        if (!client) {
            console.error(`call ==> ${namespace}#${serviceName} not available`);
            client = await this.getClient(namespace, serviceName);
        }
        return new Promise(function (resolve, reject) {
            client[methodName](request, function (err, response) {
                if (err) {
                    return reject(err);
                }
                if (response.Error) {
                    return reject(response.Error);
                }
                DEBUG(`response ==> ${namespace}#${serviceName}.${methodName} ${JSON.stringify(response)}`);
                resolve(response);
            });
        });
    }

    async invokeRetry(params) {
        let client,
            result,
            namespace = params.namespace,
            serviceName = params.serviceName,
            methodName = params.methodName;
        assert(serviceName && methodName, '[RpcClient.invokeRetry] params.serviceName and params.methodName is required');
        client = await this.getClient(namespace, serviceName);
        try {
            result = await this._invoke({
                ...params,
                Client: client
            });
        } catch (err) {
            if (params.Retry === 0) {
                throw err;
            }
            DEBUG(`invokeRetry ==> ${namespace}#${serviceName}.${methodName} Retry ${params.Retry}`);
            params.Retry = params.Retry - 1;
            result = await this.invokeRetry(params)
        }
        return result;
    }

    async _invoke(params) {
        let namespace = params.namespace,
            serviceName = params.serviceName,
            methodName = params.methodName,
            request = params.request,
            client = params.Client;
        assert(serviceName && methodName, '[RpcClient.invoke] params.serviceName and params.methodName is required');
        DEBUG(`call ==> ${namespace}#${serviceName}.${methodName} ${JSON.stringify(request)}`);
        return new Promise(function (resolve, reject) {
            client[methodName](request, function (err, response) {
                if (err) {
                    return reject(err);
                }
                DEBUG(`response ==> ${namespace}#${serviceName}.${methodName} ${JSON.stringify(response)}`);
                resolve(response);
            });
        });
    }
}

module.exports = RpcClient;