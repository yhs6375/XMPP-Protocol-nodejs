"use strict";

const net = require("net"),
    EventEmitter = require("events").EventEmitter,
    inherits = require("inherits"),
    Element = require("@xmpp/xml").Element,
    StreamParser = require("@xmpp/streamparser"),
    starttls = require("./starttls.js"),
    assign = require("lodash.assign"),
    NS = require("../config/NSPack.js");

const NS_XMPP_TLS = "urn:ietf:params:xml:ns:xmpp-tls",
    NS_STREAM = "http://etherx.jabber.org/streams",
    NS_XMPP_STREAMS = "urn:ietf:params:xml:ns:xmpp-streams",
    INITIAL_RECONNECT_DELAY = 1e3,
    MAX_RECONNECT_DELAY = 30e3,
    STREAM_OPEN = "stream:stream",
    STREAM_CLOSE = "</stream:stream>";

function getAllText(el) {
    return !el.children
        ? el
        : el.children.reduce(function (text, child) {
              return text + getAllText(child);
          }, "");
}

class Connection extends EventEmitter {
    pause() {
        if (this.socket.pause) this.socket.pause();
    }
    resume() {
        if (this.socket.resume) this.socket.resume();
    }
    send(stanza) {}
    stopParser() {
        if (this.parser) {
            var parser = this.parser;
            this.parser = null;
            parser.end();
        }
    }
    openStream() {
        var attrs = {};
        for (var k in this.xmlns) {
            if (this.xmlns.hasOwnProperty(k)) {
                if (!k) {
                    attrs.xmlns = this.xmlns[k];
                } else {
                    attrs["xmlns:" + k] = this.xmlns[k];
                }
            }
        }
        for (k in this.streamAttrs) {
            if (this.streamAttrs.hasOwnProperty(k)) {
                attrs[k] = this.streamAttrs[k];
            }
        }

        if (this.streamTo) {
            attrs.to = this.streamTo;
        }

        var el = new Element(NS.STREAM_OPEN, attrs);
        var streamOpen;
        if (el.name === "stream:stream") {
            el.t(" ");
            var s = el.toString();
            streamOpen = s.substr(0, s.indexOf(" </stream:stream>"));
        } else {
            streamOpen = el.toString();
        }
        this.streamOpened = true;

        this.send(streamOpen);
    }

    setSecure(credentials, isServer, servername) {
        // Remove old event listeners
        this.socket.removeListener("data", this.boundOnData);
        this.socket.removeListener("data", this.boundEmitData);

        // retain socket 'end' listeners because ssl layer doesn't support it
        this.socket.removeListener("drain", this.boundEmitDrain);
        this.socket.removeListener("close", this.boundOnClose);
        // remove idle_timeout
        if (this.socket.clearTimer) {
            this.socket.clearTimer();
        }

        var cleartext = starttls(
            {
                socket: this.socket,
                rejectUnauthorized: this.rejectUnauthorized,
                credentials: credentials || this.credentials,
                requestCert: this.requestCert,
                isServer: !!isServer,
                servername: isServer && servername,
            },
            function () {
                this.isSecure = true;
                this.once("disconnect", function () {
                    this.isSecure = false;
                });
                cleartext.emit("connect", cleartext);
            }.bind(this)
        );
        cleartext.on("clientError", this.emit.bind(this, "error"));
        if (!this.reconnect) {
            this.reconnect = true;
            this.once("reconnect", function () {
                this.reconnect = false;
            });
        }
        this.stopParser();
        this.listen({ socket: cleartext, preserve: "on" });
    }
    onStanza(stanza) {
        if (stanza.is("error", NS_STREAM)) {
            var error = new Error("" + getAllText(stanza));
            error.stanza = stanza;
            this.socket.emit("error", error);
        } else if (
            stanza.is("features", this.NS_STREAM) &&
            this.allowTLS &&
            !this.isSecure &&
            stanza.getChild("starttls", this.NS_XMPP_TLS)
        ) {
            /* Signal willingness to perform TLS handshake */
            this.send(new Element("starttls", { xmlns: this.NS_XMPP_TLS }));
        } else if (this.allowTLS && stanza.is("proceed", this.NS_XMPP_TLS)) {
            /* Server is waiting for TLS handshake */
            this.setSecure();
        } else {
            this.emit("stanza", stanza);
        }
    }
    addStreamNs(stanza) {
        console.log("Connection.js 378 addStreamNs");
        console.log(this.streamNsAttrs);
        for (var attr in this.streamNsAttrs) {
            if (!stanza.attrs[attr] && !(attr === "xmlns" && this.streamNsAttrs[attr] === this.xmlns[""])) {
                stanza.attrs[attr] = this.streamNsAttrs[attr];
            }
        }
        return stanza;
    }
    rmXmlns(stanza) {
        for (var prefix in this.xmlns) {
            var attr = prefix ? "xmlns:" + prefix : "xmlns";
            if (stanza.attrs[attr] === this.xmlns[prefix]) {
                stanza.attrs[attr] = null;
            }
        }
        return stanza;
    }

    error(condition, message) {
        this.emit("error", new Error(message));

        if (!this.socket || !this.socket.writable) return;

        /* RFC 3920, 4.7.1 stream-level errors rules */
        if (!this.streamOpened) this.openStream();

        var error = new Element("stream:error");
        error.c(condition, { xmlns: NS_XMPP_STREAMS });
        if (message) {
            error
                .c("text", {
                    xmlns: NS_XMPP_STREAMS,
                    "xml:lang": "en",
                })
                .t(message);
        }

        this.send(error);
        this.end();
    }
}
Connection.prototype.NS_XMPP_TLS = NS_XMPP_TLS;
Connection.prototype.NS_STREAM = NS_STREAM;
Connection.prototype.NS_XMPP_STREAMS = NS_XMPP_STREAMS;
Connection.prototype.allowTLS = true;
Connection.prototype.startStream = Connection.prototype.openStream;

Connection.prototype.endStream = Connection.prototype.closeStream;

module.exports = Connection;
