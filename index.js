/*jslint node:true*/

module.exports = {
    RpcClient: require('./client.js'),
    RpcServer: require('./server.js'),
    ConfigRegistry: require('./registry/confgRegistry.js'),
    RedisRegistry: require('./registry/redisRegistry.js'),
    ZookeeperRegistry: require("./registry/zookeeperRegistry")
}