## summary
This repo is a common module for all backend repo which needs rpc service. The rpc service providing or consuming is based on [gRpc](https://github.com/grpc/grpc-node)
- RpcClient: a factory class to get gRpc client.
- RpcServer: a proxy class for gRpc server.
- ConfigRegistry: a simple registry class just making use of json config file
- RedisRegistry: a register class based on redis

## exmaple
- create server

`protoFolder` is the proto folder in your project. if ignore the parameter, rpc_base will find proto in its internal proto folder. rpc_base find proto by serviceName and namespace. if namespace is "MedLinc" and serviceName is "Like", 
the proto name id "MedLinc.Like.proto". This module will first search the proto in the outer proto folder. if not found, it will search in the internal proto folder. 

```
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
        protoFolder: __dirname + '/../proto/'  // the proto folder in your project
    }),
    serviceFileNames = fs.readdirSync(servicePath);
```
- add and registry service

```
function getServiceName(fileName) {
    if (fileName.indexOf("Service") === -1) {
        return "";
    }
    return fileName.split("Service")[0];
}

let serviceName = getServiceName(fileName);
// registry service in redis
 redisRegistry.register({ serviceName: serviceName, address: "0.0.0.0:" + 8002 });
rpcServicePath = servicePath + '/' + fileName;
rpcService = require(rpcServicePath);
methodsToAddedInOneService = {};
Object.keys(rpcService).forEach((methodName) => {
    methodsToAddedInOneService[methodName] = rpcService[methodName];
});
rpcServer.addService(serviceName, methodsToAddedInOneService);
```

- create client 
When creating RpcClient, you must create registry first. The address of ConfigRegistry is the config file path. The address of RedisRegistry is its network location.

```
const RpcClient = require('rpc_base').RpcClient,
    // RedisRegistry = require('rpc_base').RedisRegistry;
    ConfigRegistry = require('rpc_base').ConfigRegistry;

// let registry = new RedisRegistry({ address: "localhost:6379" }),
let registry = new ConfigRegistry({ address: "./config.json" }), 
    rpcClient = new RpcClient({ registry: registry, protoFolder: "../proto" });
```
- invoke a remote service
```
async function start() {
    try {
        res = await rpcClient.invoke({
            serviceName: "Like",
            methodName: "Like",
            namespace: "MedLinc",
            request: {
                EntityType: 'FeedItem',
                EntityId: undefined,
                GroupId: 'f95c2ec0-d727-4b54-84b1-187bc1638423',
                UserId: '36fce540-f512-11e8-9304-a58a4ddb4cb2',
                MemberId: '36fe44d0-f512-11e8-9304-a58a4ddb4cb2',
                DisplayName: { en: 'Lihoutai-cuizhaoqiang Guan', zh: '管理后台-崔兆强' },
                SkipExisting: undefined,
                Admin: undefined,
                ServiceName: 'Like',
                MethodName: 'Like'
            }
        });
    } catch (err) {
        console.log('Error: ', err);
    }
    console.log('Result: ', res);
}

start();
```