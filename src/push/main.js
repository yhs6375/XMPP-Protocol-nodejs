const HSModulePATH = process.cwd() + "/src",
    net = require("net"),
    fs = require("fs"),
    EventEmitter = require("events").EventEmitter;

const TEMP_PATH = process.env.TMPDIR || process.env.TMP || process.env.TEMP || "/tmp";

class PushServer extends EventEmitter {
    constructor(options) {
        super();
        let server = (this.server = net.createServer(options));
        this.server.canRestart = true;
        server.on("connection", this.acceptConnection.bind(this));
        server.on("close", () => {});
    }
    acceptConnection(socket) {}
    listen(cb) {
        console.log("Push서버 listen 시작");
        this.server.listen(TEMP_PATH + "/pushserver.sock", listenStart.bind(this, cb));
        this.server.on("error", (e) => {
            console.log(e);
            if (e.code == "EADDRINUSE") {
                if (this.server.canRestart) {
                    this.server.canRestart = false;
                    fs.unlinkSync(TEMP_PATH + "/pushserver.sock");
                    this.server.listen(TEMP_PATH + "/pushserver.sock");
                }
            }
        });
    }
}
function listenStart(cb) {
    this.server.canRestart = true;
    cb();
}

module.exports = PushServer;
