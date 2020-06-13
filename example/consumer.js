const RpcClient = require('rpc_base').RpcClient,
    // RedisRegistry = require('rpc_base').RedisRegistry;
    ConfigRegistry = require('rpc_base').ConfigRegistry;

// let registry = new RedisRegistry({ address: "localhost:6379" }),
let registry = new ConfigRegistry({ address: "./config.json" }), 
    rpcClient = new RpcClient({ registry: registry, protoFolder: "../proto" });

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
