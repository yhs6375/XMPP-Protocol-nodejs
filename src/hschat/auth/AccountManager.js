const HSModulePATH = process.cwd() + "/src",
    DBManager = require(HSModulePATH + "/hschat/db/DBManager"),
    Hash = require(HSModulePATH + "/calc/Hash"),
    Bcrypt = require(HSModulePATH + "/calc/Bcrypt"),
    math = require(HSModulePATH + "/calc/math"),
    RegistrationError = require(HSModulePATH + "/hschat/errorPack").RegistrationError,
    DBError = require(HSModulePATH + "/hschat/errorPack").DBError;
class AccountManager {
    static async isRegistedID(id) {
        return (await DBManager.getUserIDX(id)).info.numRows == 0;
    }
    static async registAccount(id, pw) {
        if (!PasswordVaildCheck(pw)) {
            throw new RegistrationError(3);
        }
        if (await AccountManager.isRegistedID(id)) {
            let result, datas;
            datas = await makeUserAuthKeys(pw);
            await DBManager.createUser(id, datas);
            return;
        } else {
            throw new RegistrationError(2);
        }
    }
}
async function makeUserAuthKeys(pw) {
    let encryptedInfo, storedKey, serverKey;
    encryptedInfo = await Bcrypt.encrypt(pw);
    console.log("saltedPassword");
    console.log(Buffer.from(encryptedInfo.hash));
    return { encryptedPassword: Hash.H(encryptedInfo.hash), salt: encryptedInfo.salt };
    //storedKey=Hash.H(Hash.HMAC(encryptedInfo.hash,'Client Key'));
    //serverKey=Hash.HMAC(encryptedInfo.hash,'Server Key');
    //return {saltedPassword:encryptedInfo.hash,storedKey,serverKey};
}
//패스워드 검증 함수
function PasswordVaildCheck() {
    return true;
}
module.exports = AccountManager;
