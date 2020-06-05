/*jslint node:true*/
const grpc = require('grpc'),
    assert = require('assert'),
    protoLoader = require('@grpc/proto-loader');
;
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
        let protoPath = this.options.protoFolder + namespace + "." + serviceName + '.proto',
            packageDefinition,
            proto;
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