const grpc = require('grpc'),
    servicePath = "./services",
    RedisRegistry = require('rpc_base').RedisRegistry,
    fs = require('fs'),
    RpcServer = require('rpc_base').RpcServer,
    NameSpace = "MedLinc";
let bindPoint = "0.0.0.0:" + 8002,
    redisRegistry = new RedisRegistry({ address: "localhost:6379" }),
    rpcServer = new RpcServer({
        bindPoint: bindPoint,
        namespace: "MedLinc",
        protoFolder: __dirname + '/../proto/'
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
    // redisRegistry.register({ serviceName: serviceName, address: "0.0.0.0:" + 8002 });
    rpcServicePath = servicePath + '/' + fileName;
    rpcService = require(rpcServicePath);
    methodsToAddedInOneService = {};
    Object.keys(rpcService).forEach((methodName) => {
        methodsToAddedInOneService[methodName] = rpcService[methodName];
    });
    rpcServer.addService(serviceName, methodsToAddedInOneService);
})

rpcServer.start();