const servicePath = "./services",
    RedisRegistry = require('../index.js').RedisRegistry,
    ZookeeperRegistry = require("../index.js").ZookeeperRegistry
    fs = require('fs'),
    RpcServer = require('../index').RpcServer,
    Namespace = "Example",
    bindPoint = "0.0.0.0:" + 8002,
    registry = new RedisRegistry({ address: "localhost:6379" }),
    // registry = new ZookeeperRegistry({ address: "localhost:2181" }),
    rpcServer = new RpcServer({
        bindPoint: bindPoint,
        namespace: Namespace,
        protoFolder: __dirname + '/proto/'
    }),
    serviceFileNames = fs.readdirSync(servicePath);

function getServiceName(fileName) {
    if (fileName.indexOf("Service") === -1) {
        return "";
    }
    return fileName.split("Service")[0];
}

serviceFileNames.forEach((fileName) => {
    let serviceName = getServiceName(fileName);
    registry.register({ serviceName: serviceName, namespace: Namespace, address: "0.0.0.0:" + 8002 });
    rpcServicePath = servicePath + '/' + fileName;
    rpcService = require(rpcServicePath);
    methodsToAddedInOneService = {};
    Object.keys(rpcService).forEach((methodName) => {
        methodsToAddedInOneService[methodName] = rpcService[methodName];
    });
    rpcServer.addService(Namespace, serviceName, methodsToAddedInOneService);
})

rpcServer.start();
