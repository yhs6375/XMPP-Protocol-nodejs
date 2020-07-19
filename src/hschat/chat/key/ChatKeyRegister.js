let HSModulePATH = process.cwd() + "/src",
    NS = require(HSModulePATH + "/hschat/config/NSPack.js"),
    DBManager = require(HSModulePATH + "/hschat/db/DBManager"),
    Element = require(HSModulePATH + "/hschat/packet/Element"),
    KeyError = require(HSModulePATH + "/hschat/errorPack").HSChatKeyError;
class ChatKeyRegister {
    constructor(session) {
        this.session = session;
        this.id = session.getUserManager().id;
        this.keyDatas = {};
    }
    addIdentityKey(data) {
        this.keyDatas.identity_key = data;
    }
    addPreKeys(len, data) {
        this.keyDatas.pre_keys = data;
    }
    addSignedPreKeyAndSignature(data) {
        this.keyDatas.signed_pre_key = data.slice(0, 33);
        this.keyDatas.signed_pre_key_signature = data.slice(33, 97);
    }
    async regist() {
        try {
            if (
                this.keyDatas.identity_key &&
                this.keyDatas.pre_keys &&
                this.keyDatas.signed_pre_key &&
                this.keyDatas.signed_pre_key_signature
            ) {
                await DBManager.registInitializationChatKey(
                    this.id,
                    this.keyDatas.identity_key,
                    this.keyDatas.pre_keys,
                    this.keyDatas.signed_pre_key,
                    this.keyDatas.signed_pre_key_signature
                );
            } else if (
                this.keyDatas.pre_keys &&
                this.keyDatas.signed_pre_key &&
                this.keyDatas.signed_pre_key_signature
            ) {
            } else if (this.keyDatas.pre_keys) {
            } else if (this.keyDatas.signed_pre_key && this.keyDatas.signed_pre_key_signature) {
            } else {
                throw new KeyError(2, "");
            }
            this.sendSuccess();
        } catch (e) {
            this.sendFailure();
        }
    }
    sendSuccess() {
        this.session.send(new Element(NS.CHAT_KEY_REGISTER_SUCCESS).toString(true));
    }
    sendFailure() {
        this.session.send(new Element(NS.CHAT_KEY_REGISTER_FAILURE).toString(true));
    }
}
module.exports = ChatKeyRegister;
