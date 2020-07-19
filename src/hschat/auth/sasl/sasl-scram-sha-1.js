const HSModulePATH = process.cwd() + "/src",
    bitops = require("./lib/bitops"),
    utils = require("./lib/utils"),
    Mechanism = require("./Mechanism"),
    makeRandomBytes = require(HSModulePATH + "/calc/randomBytes"),
    Base64 = require(HSModulePATH + "/util/base64"),
    AuthError = require(HSModulePATH + "/hschat/errorPack").HSChatAuthError;

const CLIENT_KEY = "Client Key",
    SERVER_KEY = "Server Key",
    ITERATION_COUNT = 4096,
    SALT_BYTE_LENGTH = 32;

class scramSHA1 extends Mechanism {
    constructor() {
        super();
        this.challengePoint = true;
        this.ifSuccessSaveData = false;
        this.id = "SCRAM-SHA-1";
    }
    parseFirstMessage(authMsg) {
        this.clientFirstMessage = Base64.decodeToString(authMsg);
        this.parsedFirstData = utils.parse(this.clientFirstMessage);
        return { id: this.parsedFirstData.n };
    }
    parseFinalMessage(responseMsg) {
        let finalParsedValues = utils.parse(Base64.decodeToString(responseMsg));
        return { nonce: finalParsedValues.r, clientProof: finalParsedValues.p };
    }
    prepareFirstMessage(userData) {
        let server_random_nonce, salted_password, client_key;
        server_random_nonce = makeRandomBytes.randomASCII(32, 33, 127);
        if (!userData.storedKey) {
            this.ifSuccessSaveData = true;
        }
        this.salt = userData.salt ? userData.salt : makeRandomBytes.randomASCII(32, 33, 127);
        console.log("salt");
        console.log(Buffer.from(this.salt));
        salted_password = bitops.Hi(userData.encryptpassword, Buffer.from(this.salt), 4096);
        console.log("salted_password");
        console.log(salted_password);
        console.log("encryptpassword");
        console.log(Buffer.from(userData.encryptpassword));
        client_key = bitops.HMAC(salted_password, CLIENT_KEY);
        this.stored_key = bitops.H(client_key);
        this.server_key = userData.serverKey ? userData.serverKey : bitops.HMAC(salted_password, SERVER_KEY);
        this.nonce = this.parsedFirstData.r + server_random_nonce;
        this.username = this.parsedFirstData.n;
        this.serverFirstMsg = "r=" + this.nonce + ",s=" + this.salt + ",i=" + ITERATION_COUNT;
        return Base64.encodeToString(this.serverFirstMsg);
    }
    prepareFinalMessage(responseMsg) {
        let parsed_data, authMsg, clientSignature, serverSignature, decode_proof, result_key;
        parsed_data = this.parseFinalMessage(responseMsg);
        if (parsed_data.nonce != this.nonce) {
            throw new AuthError(
                "[process : prepareFinalMessage] - nonce received by client don't match saved nonce from server."
            );
        }
        authMsg = this.clientFirstMessage + "," + this.serverFirstMsg + ",r=" + parsed_data.nonce;
        clientSignature = bitops.HMAC(this.stored_key, Buffer.from(authMsg));
        console.log(clientSignature);
        console.log(clientSignature.length);
        serverSignature = bitops.HMAC(this.server_key, authMsg);
        decode_proof = Base64.decode(parsed_data.clientProof);
        console.log(decode_proof);
        console.log(decode_proof.length);
        for (let i = 0; i < clientSignature.length; i++) {
            clientSignature[i] ^= decode_proof[i];
        }
        result_key = bitops.H(clientSignature);
        if (this.stored_key.compare(result_key) !== 0) {
            throw new AuthError(4, "client proof message does not match calculated one.");
        }
        return Base64.encodeToString("v=" + Base64.encode(serverSignature));
    }
}
Object.defineProperty(scramSHA1, "name", {
    value: "SCRAM-SHA-1",
    writable: false,
    enumerable: true,
    configurable: false,
});
module.exports = scramSHA1;
