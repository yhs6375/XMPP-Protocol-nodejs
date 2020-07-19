const HSModulePATH = process.cwd() + "/src",
    config = require(HSModulePATH + "/hschat/config/config"),
    Maria = require("mariasql"),
    DBError = require(HSModulePATH + "/hschat/errorPack").DBError;
class DBManager {
    static getUserIDX(id) {
        return new Promise((resolve, reject) => {
            let mariadb_session = getDBSession();
            mariadb_session.query("select (idx) from users where userid=?", [id], (err, rows) => {
                mariadb_session.end();
                if (err) {
                    reject(new DBError(err));
                } else {
                    resolve(rows);
                }
            });
        });
    }
    static createUser(id, datas) {
        return new Promise((resolve, reject) => {
            let mariadb_session = getDBSession();
            mariadb_session.query(
                "insert into users (userid,encryptedpassword,salt,creationdate) values (?, ?, ?, ?)",
                [id, datas.encryptedPassword, datas.salt, "00" + Date.now()],
                (err, rows) => {
                    mariadb_session.end();
                    if (err) {
                        reject(new DBError(err));
                    } else {
                        resolve();
                    }
                }
            );
        });
    }
    static getAuthStoredData(id, getType) {
        return new Promise((resolve, reject) => {
            let mariadb_session = getDBSession();
            mariadb_session.query("select * from users where userid=?", [id], (err, rows) => {
                mariadb_session.end();
                if (err) {
                    reject(new DBError(err));
                } else {
                    resolve(rows[0]);
                }
            });
        });
    }
    static registInitializationChatKey(pid, identity_key, pre_keys, signed_pre_key, signature) {
        return new Promise((resolve, reject) => {
            let mariadb_session = getDBSession();
            mariadb_session.query(
                "insert into chatKeysOfUsers values (?, ?, ?, ?, ?)",
                [pid, identity_key, pre_keys, signed_pre_key, signature],
                (err, rows) => {
                    mariadb_session.end();
                    if (err) {
                        reject(new DBError(err));
                    } else {
                        resolve(rows[0]);
                    }
                }
            );
        });
    }
}
function getDBSession() {
    return new Maria(Object.assign(config.DBInfo, { db: config.DBNAME }));
}
module.exports = DBManager;
