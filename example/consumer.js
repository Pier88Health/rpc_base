const RpcClient = require('../index.js').RpcClient,
    health = require("grpc-health-check"),
    RedisRegistry = require('../index.js').RedisRegistry;
    // ConfigRegistry = require('../index.js').ConfigRegistry;
    // ZookeeperRegistry = require('../index.js').ZookeeperRegistry;

let registry = new RedisRegistry({ address: "localhost:6379" }),
// let registry = new ConfigRegistry({ address: "./config.json" }), 
// let registry = new ZookeeperRegistry({ address: "localhost:2181" }),、 ServingStatus = health_messages.HealthCheckResponse.ServingStatus
    ServingStatus = health.messages.HealthCheckResponse.ServingStatus,
    healthClient = new health.Client('localhost:' + 15678,
                                     grpc.credentials.createInsecure()),
    rpcClient = new RpcClient({ registry: registry, protoFolder: __dirname + '/proto/' });

async function start() {
    let res,
        request = new health.messages.HealthCheckRequest();
    request.setService('Serving');
    healthClient.check(request, function(err, response) {
      assert.ifError(err);
      assert.strictEqual(response.getStatus(), ServingStatus.SERVING);
    });
    try {
        res = await rpcClient.invoke({
            serviceName: "Test",
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
            }
        });
    } catch (err) {
        console.log(err);
    }
    console.log('Result: ', res);
}

start();
