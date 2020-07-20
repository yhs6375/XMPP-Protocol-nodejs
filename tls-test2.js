const fs = require("fs"),
    tls = require("tls"),
    net = require("net");
let options = {
    key: fs.readFileSync("test2/server.key"),
    cert: fs.readFileSync("test2/server.crt"),
    ca: fs.readFileSync("test2/ca.crt"),
};
let server = net.createServer((c) => {
    console.log("client connect");
    c.on("data", (data) => {
        console.log("tcp" + data);
        let tlsSocket = new tls.TLSSocket(c, {
            secureContext: tls.createSecureContext(options),
            //credentials: tls.createSecureContext(options),
            //key: fs.readFileSync('test2/server.key'),
            //cert: fs.readFileSync('test2/server.crt'),
            //ca: fs.readFileSync('test2/ca.crt'),
            rejectUnauthorized: true,
            requestCert: true,
            isServer: true,
        });
        tlsSocket.on("secure", function (chunk) {
            console.log(tlsSocket.getPeerCertificate());
        });
        tlsSocket.on("secureConnect", (c) => {
            console.log(c);
        });
        tlsSocket.on("secureConnection", (c) => {
            console.log(c);
        });
        c.write("haha");
    });
    c.on("end", () => {
        console.log("client disconnected");
    });
});
server.on("error", (err) => {
    throw err;
});
server.listen(8109, () => {
    console.log("server bound");
});
