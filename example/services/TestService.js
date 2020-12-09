/*jslint node:true*/
function addErrorHandleDecorator(func) {
    return async function (call, callback) {
        try {
            let results = await func(call);
            callback(null, results);
        } catch (error) {
            callback(null, {
                Error: error
            });
        }
    };
}

let methods = {
    Like: async function (call) {
        console.log('Like:', call.request.EntityType);
        let params = {
            GroupId: call.request.GroupId,
            EntityType: call.request.EntityType,
            EntityId: call.request.EntityId,
            UserId: call.request.UserId,
            MemberId: call.request.MemberId,
            DisplayName: call.request.DisplayName,
            SkipExisting: call.request.SkipExisting,
            Admin: call.request.Admin
        };
        console.log('Request params: ', params);
        return {
            p8Id: '83d34830-db3d-11e8-8e41-53391f918203',
            GroupId: 'f95c2ec0-d727-4b54-84b1-187bc1638423',
            DisplayName: {
                zh: "小明",
                en: "Xiaoming"
            },
            EntityType: "EntityType",
            EntityId: "d072d1f0-fc27-11e8-ae3e-d901852bd2b9",
            MemberId: "18c615c0-4ba6-11e9-b617-cdd41cd9e4eb",
            CreatedBy: "52958ad0-4c44-11e9-bd52-e728f26467df"
        };
    }
};

Object.keys(methods).forEach((methodName) => {
    methods[methodName] = addErrorHandleDecorator(methods[methodName]);
});

module.exports = methods;