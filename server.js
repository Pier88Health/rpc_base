/*jslint node:true*/
const grpc = require('grpc'),
    assert = require('assert'),
    commom = require('./lib/common'),
    DEBUG = require('debug')('rpc_base#server'),
    protoLoader = require('@grpc/proto-loader');
const defaultOptions = {
    protoFolder: __dirname + '/proto/'
}
class RpcServer{
    constructor(options = {}) {
        assert(options.bindPoint, '[RpcServer] options.bindPoint is required')
        this.options = Object.assign({}, defaultOptions, options);
        this.server = new grpc.Server();
    }

    async addService(namespace, serviceName, methodMap) {
        assert(serviceName, '[RpcServer.addService] params.serviceName is required');
        assert(methodMap, '[RpcServer.addService] params.methodMap is required');
        DEBUG(`RpcServer#addService ${namespace} ${serviceName}`);
        let protoFileName = commom.BuildProtoFileName(namespace, serviceName),
            protoPath = commom.GetProtoFilePath(this.options.protoFolder, protoFileName),
            packageDefinition,
            proto;
        assert(protoPath, `${serviceName} proto file not found`);
        DEBUG(`RpcServer#addService proto path ${protoPath}`);
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
        this.server.addService(proto[serviceName].service, methodMap);
    }

    start() {
        this.server.bind(this.options.bindPoint, grpc.ServerCredentials.createInsecure());
        this.server.start();
    }
}

module.exports = RpcServer;