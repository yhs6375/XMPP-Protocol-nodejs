const HSModulePATH = process.cwd() + "/src",
    Plain = require(HSModulePATH + "/hschat/auth/sasl/Plain"),
    scramBcrypt = require(HSModulePATH + "/hschat/auth/sasl/scram-bcrypt"),
    fs = require("fs");

module.exports = {
    //XMPP가 사용할 기본 포트
    port: 5222,
    //servername:'servername123',
    enableTLS: true,
    enableSASL: [Plain, scramBcrypt],
    rejectUnauthorized: true,
    requestCert: true,
    serverKey: fs.readFileSync("/home/hosung/Desktop/webhome/server/test2/server.key"),
    cert: fs.readFileSync("/home/hosung/Desktop/webhome/server/test2/server.crt"),
    ca: fs.readFileSync("/home/hosung/Desktop/webhome/server/test2/ca.crt"),
    DBInfo: {
        host: "127.0.0.1",
        user: "root",
        password: "a644260",
    },
    DBNAME: "hschattest",
    pushServer: true,
};
Object.freeze(module.exports);
