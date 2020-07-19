const HSModulePATH = process.cwd() + "/src",
    config = require(HSModulePATH + "/hschat/config/config"),
    NS = require(HSModulePATH + "/hschat/config/NSPack.js"),
    Element = require(HSModulePATH + "/hschat/packet/Element"),
    DBManager = require(HSModulePATH + "/hschat/db/DBManager"),
    AuthError = require(HSModulePATH + "/hschat/errorPack").HSChatAuthError,
    DevelopError = require(HSModulePATH + "/hschat/errorPack").DevelopError;
class UserManager {
    constructor(session) {
        this.session = session;
        this.authenticated = false;
        this.id = null;
        this.userID = null;
        this.initialize();
    }
    initialize() {
        this.mechanism = null;
        this.authData = null;
        this.authState = UserManager.INITIAL;
    }
    async authenticate(mechanismName, authMessage) {
        if (this.authenticated) {
            throw new AuthError(5, "Already login - " + this.username);
        }
        if (this.authState !== UserManager.INITIAL) {
            throw new AuthError(7, "Illegal Auth State - INITIAL");
        }
        this.mechanism = selectMechanism(mechanismName);
        if (!this.mechanism) {
            throw new AuthError(2);
        }
        let result, info, userData, storedUserData;
        this.userID = this.mechanism.parseFirstMessage(authMessage);
        storedUserData = await DBManager.getAuthStoredData(this.userID);
        this.id = storedUserData.idx;
        if (storedUserData) {
            if (this.mechanism.challengePoint) {
                this.sendChallenge(storedUserData);
            } else {
                //mechanism이 Plain인 경우 인증성공시 차후 challenge가 없으므로 성공
                this.authState = UserManager.VALID_CLIENT_RESPONSE;
                this.authenticateSuccess();
            }
        } else {
            throw new AuthError(3);
        }
    }
    processResponse(response) {
        if (this.authenticated) {
            throw new AuthError(5, "Already login - " + this.username);
        }
        if (this.authState !== UserManager.CHALLENGE_SENT) {
            throw new AuthError(7, "Illegal Auth State - CHALLENGE_SENT");
        }
        let serverFinalMsg = this.mechanism.prepareFinalMessage(response);
        this.authState = UserManager.VALID_CLIENT_RESPONSE;
        this.authenticateSuccess(serverFinalMsg);
    }
    authenticateSuccess(challenge) {
        let auth_success_el = new Element(NS.AUTH_SUCCESS);
        if (challenge) {
            if (typeof challenge === "string") {
                auth_success_el.t(challenge);
            } else {
                throw new DevelopError("Authenticate Success challenge message must be type of string");
            }
        }
        this.session.send(auth_success_el.toString(true));
        this.authenticated = true;
        this.initialize();
    }
    getMechanism() {
        return this.mechanism;
    }
    sendChallenge(userData) {
        let challengeString = this.mechanism.prepareFirstMessage(userData);
        this.authState = UserManager.CHALLENGE_SENT;
        this.session.send(new Element(NS.AUTH_CHALLENGE).t(challengeString).toString(true));
    }
    authFailure(e) {
        /* code definition
      1 == unnormal error
      2 == unknown mechanism error
      3 == unregisted id
      4 == mismatch password
      5 == already login
    */
        console.log(e);
        let errCode = 0;
        if (e instanceof AuthError && e.errType >= 2 && e.errType <= 5) {
            errCode = e.errType;
        } else {
            errCode = 1;
        }
        if (errCode !== 5) {
            this.userID = null;
            this.id = null;
        }
        this.initialize();
        this.session.send(new Element(NS.AUTH_FAILURE, { code: errCode }).toString(true));
    }
}
function selectMechanism(mechanismName) {
    let matchingMechs = config.enableSASL.filter(function (mech) {
        return mech.name === mechanismName;
    });
    return new matchingMechs[0]();
}
function makeStaticConst(name, value) {
    Object.defineProperty(UserManager, name, {
        value: value,
        writable: false,
        enumerable: true,
        configurable: false,
    });
}
makeStaticConst("INITIAL", 0);
makeStaticConst("CHALLENGE_SENT", 1);
makeStaticConst("VALID_CLIENT_RESPONSE", 2);
module.exports = UserManager;
