const HSModulePATH = process.cwd() + "/src",
    Hash = require(HSModulePATH + "/calc/Hash"),
    math = require(HSModulePATH + "/calc/math"),
    utils = require("./lib/utils"),
    Mechanism = require("./Mechanism"),
    makeRandomBytes = require(HSModulePATH + "/calc/randomBytes"),
    Base64 = require(HSModulePATH + "/util/base64"),
    AuthError = require(HSModulePATH + "/hschat/errorPack").HSChatAuthError;

class scramBcrypt extends Mechanism {
    constructor() {
        super();
        this.challengePoint = true;
    }
    parseFirstMessage(authMsg) {
        this.clientFirstMessage = Base64.decodeToString(authMsg);
        let parsed_data = utils.parse(this.clientFirstMessage);
        this.client_random_nonce = parsed_data.r;
        this.username = parsed_data.n;
        return this.username;
    }
    parseFinalMessage(responseMsg) {
        let parsed_data = utils.parse(Base64.decodeToString(responseMsg));
        return { nonce: parsed_data.r, clientProof: parsed_data.p };
    }
    prepareFirstMessage(userData) {
        let server_random_nonce, hash, client_key;
        if (!isEnoughDatas(userData)) {
            throw new AuthError(5);
        }
        server_random_nonce = makeRandomBytes.randomASCII(32, 33, 127);
        this.challenge = this.client_random_nonce + server_random_nonce;
        this.hash = Buffer.from(userData.encryptedpassword, "binary");
        this.salt = userData.salt;
        this.serverFirstMsg = "r=" + this.challenge + ",s=" + this.salt;
        return Base64.encodeToString(this.serverFirstMsg);
    }
    prepareFinalMessage(responseMsg) {
        let parsed_data, decode_proof, combinedHash, result_key;
        parsed_data = this.parseFinalMessage(responseMsg);
        if (parsed_data.nonce != this.challenge) {
            throw new AuthError(
                "[process : prepareFinalMessage] - nonce received by client don't match saved nonce from server."
            );
        }
        decode_proof = Base64.decode(parsed_data.clientProof);
        combinedHash = Hash.H(Buffer.concat([this.hash, Buffer.from(this.challenge, "binary")]));
        result_key = Hash.H(math.xor(combinedHash, decode_proof));
        if (this.hash.compare(result_key) !== 0) {
            throw new AuthError(4, "client proof message does not match calculated one.");
        }
        return;
    }
}
function isEnoughDatas(datas) {
    if (datas.encryptedpassword && datas.salt) {
        return true;
    }
    return false;
}
Object.defineProperty(scramBcrypt, "name", {
    value: "SCRAM-BCRYPT",
    writable: false,
    enumerable: true,
    configurable: false,
});
module.exports = scramBcrypt;
