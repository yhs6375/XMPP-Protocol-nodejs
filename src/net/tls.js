const tls = require("tls");
function connect(options, cb) {
    let socket,
        defaults = {
            rejectUnauthorized: true,
            requestCert: true,
            isServer: true,
        };
    options = Object.assign(defaults, options);
    socket = new tls.TLSSocket(options.socket, {
        secureContext: tls.createSecureContext({
            key: options.key,
            cert: options.cert,
            ca: options.ca,
        }),
        isServer: options.isServer,
        rejectUnauthorized: options.rejectUnauthorized,
        requestCert: options.requestCert,
    });
    socket._releaseControl();
    /*socket.once('secureConnect',()=>{
    console.log('secureConnect')
    socket.emit('connect',socket);
  })*/
    socket.on("secure", () => {
        console.log("start handshaking");
        let ssl = socket._ssl || socket.ssl;
        let verifyError = ssl.verifyError();
        if (verifyError) {
            socket.authorized = false;
            socket.authorizationError = verifyError.message;

            if (options.rejectUnauthorized) {
                socket.emit("error", verifyError);
                socket.destroy();
                return;
            } else {
                socket.emit("secureConnect");
            }
        } else {
            console.log("success handshake");
            socket.authorized = true;
            socket.emit("secureConnect");
        }
    });
    socket.on("clientError", () => {});
    return socket;
}
module.exports = connect;
