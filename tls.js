var fs = require("fs"),
    tls = require("tls");
var options = {
    key: fs.readFileSync("test2/server.key"),
    cert: fs.readFileSync("test2/server.crt"),
    ca: fs.readFileSync("test2/ca.crt"),
    requestCert: true,
    //rejectUnauthorized:true
};
var server = tls.createServer(options, function (cleartextStream) {
    cleartextStream.on("data", (data) => {
        console.log(data);
    });
    cleartextStream.on("close", function () {
        cleartextStream.destroy();
    });
    cleartextStream.write("welcome!\n");
    cleartextStream.setEncoding("utf8");
    cleartextStream.pipe(cleartextStream);
});
console.log(server);
server.listen(443, function () {
    console.log("server bound");
});
