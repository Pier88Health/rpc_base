'use strict';
const path = require('path');
const fs = require('fs');
const defaultProtoFolder = path.join(__dirname, "../proto");
const tmpProtoFolder = path.join(__dirname, "../tmp_proto");
function getProtoFilePath(protoFolder, fileName) {
    let filePath = path.join(protoFolder, fileName);
    if(fs.existsSync(filePath)) {
        return filePath;
    }
    
    if(defaultProtoFolder !== protoFolder) {
        filePath = path.join(defaultProtoFolder, fileName);
        if(fs.existsSync(filePath)) {
            return filePath;
        }
    }
    return null
}

function buildServiceKey(namespace, serviceName) {
    return `${namespace}.${serviceName}`;
}

function buildProtoFileName(namespace, serviceName) {
    return  `${namespace}.${serviceName}.proto`
}
module.exports = {
    GetProtoFilePath: getProtoFilePath,
    BuildServiceKey: buildServiceKey,
    BuildProtoFileName: buildProtoFileName
}