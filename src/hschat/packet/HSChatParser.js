const HSModulePATH = process.cwd() + "/src",
    EventEmitter = require("events").EventEmitter,
    NS = require(HSModulePATH + "/hschat/config/NSPack"),
    HSChatReader = require(HSModulePATH + "/hschat/packet/HSChatReader"),
    HSChatParseError = require(HSModulePATH + "/hschat/errorPack").HSChatParseError,
    bufUtil = require(HSModulePATH + "/util/bufUtil"),
    Base64 = require(HSModulePATH + "/util/base64"),
    ChatKeyRegister = require(HSModulePATH + "/hschat/chat/key/ChatKeyRegister");

class HSChatParser {
    constructor(session) {
        this.session = session;
        this.stopCheckStart = false;
        this.Reader = new HSChatReader();
        this.readAttrSavePos = 0;
    }
    addData(msg) {
        let reader = this.Reader,
            el;
        reader.addData(msg);
        reader.state.continue = true;
        while ((el = reader.read())) {
            switch (reader.outState.checkState) {
                case HSChatReader.CHECK_START:
                    this.checkStart(el);
                    break;
                case HSChatReader.CHECK_END:
                    this.checkEnd(el);
                    break;
            }
        }
    }
    checkStart(el) {
        let reader = this.Reader;
        let elName = el.name;
        console.log("tagCheck(Start) : " + elName);
        if (elName === NS.STREAM_OPEN) {
            this.session.startStream();
            this.stopCheckStart = true;
            reader.changeRootDepth(reader.depth + 1);
        }
        console.log("checkStart end!!");
        reader.outState.report = false;
    }
    checkEnd(el) {
        let reader = this.Reader,
            elName = el.name;
        console.log("tagCheck(End) : " + elName);
        console.log("depth : " + reader.depth);
        if (elName === NS.START_TLS) {
            this.session.startTLS();
        } else if (elName === NS.REGISTER) {
            let decodeData = Base64.decode(el.contents, "base64"),
                id,
                plainPassword;
            [id, plainPassword] = bufUtil.split(decodeData, "\r\r");
            id = id.toString();
            plainPassword = plainPassword.toString();
            this.session.registration({ id, plainPassword });
        } else if (elName === NS.AUTH) {
            let mechanism = el.attrs.mechanism;
            if (mechanism) {
                this.session.authenticate(mechanism, el.contents);
            } else {
                throw new HSChatSecureError("client didn't choose SASL mechanism");
            }
        } else if (elName === NS.CHALLENGE_RESPONSE) {
            let responseMessage = el.contents;
            this.session.finalAuthenticate(responseMessage);
        } else if (elName === NS.IDENTITY_REGISTER) {
            let register = new ChatKeyRegister(this.session);
            register.addIdentityKey(Base64.decode(el.contents));
            for (let i = 0; i < el.childCount; i++) {
                let child = el.childs[i];
                if (child.name === NS.PREKEY_REGISTER) {
                    register.addPreKeys(parseInt(child.attrs.c, 10), Base64.decode(child.contents));
                } else if (child.name === NS.SIGNED_PREKEY_REGISTER) {
                    register.addSignedPreKeyAndSignature(Base64.decode(child.contents));
                } else {
                    throw new HSChatParseError("Identity regist problem");
                }
            }
            register.regist();
        } else if (elName === NS.PREKEY_REGISTER) {
            let register = new ChatKeyRegister(this.session);
            register.addPreKeys(parseInt(el.attrs.c, 10), Base64.decode(el.contents));
            register.regist();
        } else {
            throw new HSChatParseError("Unknown tag name : " + elName);
        }
    }
}
module.exports = HSChatParser;
