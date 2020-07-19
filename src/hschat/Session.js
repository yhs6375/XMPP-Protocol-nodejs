"use strict";
const HSModulePATH = process.cwd() + "/src",
    EventEmitter = require("events").EventEmitter,
    util = require("util"),
    Element = require(HSModulePATH + "/hschat/packet/Element"),
    generateId = require(HSModulePATH + "/calc/makeRandomId.js").rack(),
    NS = require("./config/NSPack.js"),
    Parser = require(HSModulePATH + "/hschat/packet/HSChatParser"),
    tlsConnect = require(HSModulePATH + "/net/tls"),
    UserManager = require(HSModulePATH + "/hschat/auth/UserManager"),
    AccountManager = require(HSModulePATH + "/hschat/auth/AccountManager");

const HSChatErrorPack = require(HSModulePATH + "/hschat/errorPack"),
    RegistrationError = HSChatErrorPack.RegistrationError,
    HSChatParseError = HSChatErrorPack.HSChatParseError,
    HSChatSecureError = HSChatErrorPack.HSChatSecureError,
    AuthError = HSChatErrorPack.HSChatAuthError;

const INITIAL_RECONNECT_DELAY = 1e3,
    MAX_RECONNECT_DELAY = 30e3;

class Session extends EventEmitter {
    constructor(opts) {
        super();
        this.userManager = new UserManager(this);
        this.server = opts.server;
        this.id = generateId();
        this.streamAttr = (opts && opts.streamAttrs) || {};
        this.xmlns = (opts && opts.xmlns) || {};
        this.xmlns.stream = NS.NS_STREAMS;
        this.serialized = !!(opts && opts.serialized);
        this.servername = opts.serverName;
        this.socket = opts.socket;
        this.initialized = false;
        this.enableTLS = opts.enableTLS;
        this.boundOnEnd = this.onEnd.bind(this);
        this.boundOnData = this.onData.bind(this);
        this.initialize();
    }
    initialize() {
        if (!this.initialized) {
            this.socket.on("end", this.boundOnEnd);
            this.socket.on("data", this.boundOnData);
            this.initialized = true;
            this.startParser();
        }
    }
    reInitialize() {
        if (this.initialized) {
            this.socket.on("data", this.boundOnData);
            this.restartParser();
        }
    }
    disconnect() {
        console.log("this.end");
        this.closeStream();
        this.reconnect = false;
        if (this._connection) this._connection.end();
        this.emit("disconnect");
    }
    socketAddListener() {
        this.socket.on("end", this.boundOnEnd);
        this.socket.on("data", this.boundOnData);
    }
    socketRemoveListener() {
        console.log("haha");
        this.socket.removeListener("data", this.boundOnData);
    }
    send(stanza) {
        if (!this.socket || !this.streamOpened) return;
        if (!this.socket.writable) {
            this.socket.end();
            return;
        }
        let flushed = true;
        flushed = this.socket.write(stanza);
        return flushed;
    }
    pause() {
        if (this.connection.pause) {
            this.connection.pause();
        }
    }
    resume() {
        if (this.connection.resume) {
            this.connection.resume();
        }
    }
    end() {
        this.connection.end();
    }
    startStream() {
        this.openStream();
        this.sendFeatures();
    }
    openStream() {
        let streamOpen = new Element(NS.STREAM_OPEN, { id: this.id });
        this.streamOpened = true;
        this.send(streamOpen.toString(false));
    }
    sendFeatures() {
        let features = new Element(NS.FEATURES);
        if (!this.authenticated) {
            if (this.server) {
                //TLS
                let opts = this.server.options;
                if (!this.isSecure) {
                    let starttlsInfeature = features.c(NS.START_TLS);
                    if (this.enableTLS) {
                        starttlsInfeature.c(NS.REQUIRED);
                    }
                }
                if (!this.userManager.authenticated && this.server.availableSaslMechanisms) {
                    this.mechanisms = this.server.availableSaslMechanisms;
                    let mechanismsEl = features.c(NS.MECHANISMS);
                    this.mechanisms.forEach((mech) => {
                        mechanismsEl.c(NS.MECHANISM).t(mech.name);
                    });
                }
            }
        }
        this.send(features.toString(true));
    }
    startTLS() {
        let self = this,
            proceed = new Element(NS.PROCEED);
        this.send(proceed.toString(true));

        this.socket.removeListener("data", this.boundOnData);
        this.socket = tlsConnect({
            socket: this.socket,
            rejectUnauthorized: this.server.rejectUnauthorized,
            requestCert: this.server.requestCert,
            key: this.server.serverKey,
            cert: this.server.cert,
            ca: this.server.ca,
        });
        this.socket.on("secureConnect", () => {
            self.isSecure = true;
            self.reInitialize();
        });
    }
    startParser() {
        this.parser = new Parser(this);
    }
    stopParser() {
        if (this.parser) {
            this.parser = null;
        }
    }
    restartParser() {
        this.stopParser();
        this.startParser();
    }
    decode64(encoded) {
        return new Buffer(encoded, "base64").toString("utf8");
    }
    closeStream() {
        this.send(NS.STREAM_CLOSE);
        this.streamOpened = false;
    }
    authenticate(mechanismName, authMessage) {
        this.userManager
            .authenticate(mechanismName, authMessage)
            .then(() => {})
            .catch((e) => {
                this.userManager.authFailure(e);
            });
    }
    finalAuthenticate(responseMsg) {
        try {
            this.userManager.processResponse(responseMsg);
            this.restartParser();
        } catch (e) {
            this.userManager.authFailure(e);
        }
    }
    registration(userInfo) {
        AccountManager.registAccount(userInfo.id, userInfo.plainPassword)
            .then(() => {
                let rs = new Element(NS.REGISTER_SUCCESS).toString(true);
                this.send(rs);
                this.emit("register", userInfo.id);
            })
            .catch((e) => {
                console.log(e);
                if (e instanceof RegistrationError) {
                    if (e.errType === 3) {
                        //규정에 안맞는 패스워드
                        this.send(new Element(NS.REGISTER_FAILURE, { code: 3 }).toString(true));
                    } else if (e.errType === 2) {
                        //이미 가입된 계정
                        this.send(new Element(NS.REGISTER_FAILURE, { code: 2 }).toString(true));
                    }
                } else {
                    this.send(new Element(NS.REGISTER_FAILURE, { code: 1 }).toString(true));
                }
            });
    }
    getUserManager() {
        return this.userManager;
    }
    onSession(stanza) {
        console.log("Session.js 319 onSession");
        var result = new IQ({ type: "result", id: stanza.attrs.id }).c("session", { xmlns: NS_SESSION });
        this.send(result);
        this.emit("online");
    }
    onData(data) {
        let msg = data.toString("utf8");
        console.log("received packet : " + msg);
        if (this.parser) {
            console.log("add data : " + msg);
            this.parser.addData(msg);
        }
    }
    onEnd() {
        this.closeStream();
        if (!this.reconnect) {
            this.emit("end");
        }
    }
    onClose() {
        if (!this.reconnect) {
            this.emit("close");
        }
    }
    error() {
        this.emit("error", msg);
    }
}

module.exports = Session;
