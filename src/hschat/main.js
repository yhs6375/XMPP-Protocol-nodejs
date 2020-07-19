"use strict";

const HSModulePATH = process.cwd() + "/src",
    util = require("util"),
    net = require("net"),
    fs = require("fs"),
    EventEmitter = require("events").EventEmitter,
    Session = require("./Session"),
    config = require("./config/config"),
    databaseSetting = require(HSModulePATH + "/hschat/db/setDatabase");

class HSChatServer extends EventEmitter {
    constructor(options) {
        //서버 세팅 시작
        super();
        databaseSetting()
            .then(() => {
                this.options = options || {};
                this.DEFAULT_PORT = config.port;
                //서버가 사용할 SASL Mechanism
                this.availableSaslMechanisms = config.enableSASL;
                this.rejectUnauthorized = config.rejectUnauthorized;
                this.requestCert = config.requestCert;
                this.serverName = config.serverName;
                this.serverKey = config.serverKey;
                this.cert = config.cert;
                this.ca = config.ca;

                if (this.options.requestCert && this.options.rejectUnauthorized !== false) {
                    this.options.rejectUnauthorized = true;
                }

                let server = (this.server = net.createServer(options));
                server.on("connection", this.acceptConnection.bind(this));
                server.on("close", this.emit.bind(this, "close"));
                server.on("error", this.emit.bind(this, "error"));
                server.on("listening", this.emit.bind(this, "listening"));

                this.port = this.options.port || this.DEFAULT_PORT;
                this.sessions = new Set();

                this.on("connection", this.onConnection.bind(this));

                //xmpp events
                this.on("listening", this.emit.bind(this, "online"));
                this.on("close", this.emit.bind(this, "offline"));
                this.on("close", this.emit.bind(this, "shutdown"));

                //autostart가 false가 아니라면 listen 시작
                if (this.server && this.options.autostart !== false) {
                    this.listen();
                }
            })
            .catch((e) => {
                console.log(e);
            });
    }
    listen(fn) {
        console.log("HSChat서버 listen 시작");
        this.server.listen(this.port, this.options.host || "::", fn);
    }
    //서버가 연결을 받으면 호출되는 함수
    acceptConnection(socket) {
        let session = new Session({
            rejectUnauthorized: this.options.rejectUnauthorized,
            requestCert: this.options.requestCert,
            socket: socket,
            server: this,
            enableTLS: config.enableTLS,
        });
        socket.session = session;
        this.emit("connection", session);
    }
    onConnection(session) {
        this.sessions.add(session);
        session.once("close", this.onConnectionClosed.bind(this, session));
        this.emit("connect", session);
    }
    onConnectionClosed(connection) {
        this.sessions.delete(connection);
    }
    getSaslMechanisms() {
        return this.availableSaslMechanisms;
    }
}

module.exports = HSChatServer;
