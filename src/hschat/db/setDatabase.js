const HSModulePATH = process.cwd() + "/src",
    config = require(HSModulePATH + "/hschat/config/config"),
    Maria = require("mariasql"),
    InitiateError = require(HSModulePATH + "/hschat/errorPack").InitiateError;
function queryAsync(query) {
    return new Promise((resolve, reject) => {
        let mariadb_session = getDBSession();
        mariadb_session.query(query, (err, rows) => {
            if (!err) {
                mariadb_session.end();
                resolve();
            } else {
                mariadb_session.end();
                reject(new InitiateError("An error occurred when craete table.\n" + err));
            }
        });
    });
}
async function queryAsyncSequence(querys) {
    for (let i = 0; i < querys.length; i++) {
        await queryAsync(querys[i]);
    }
    return;
}
function getDefaultSession() {
    return new Maria(config.DBInfo);
}
function getDBSession() {
    return new Maria(Object.assign(config.DBInfo, { db: config.DBNAME }));
}
function setDatabase() {
    return new Promise((resolve, reject) => {
        let mariadb_session = getDefaultSession();
        mariadb_session.query("drop database " + config.DBNAME, (err, rows) => {
            if (!err) {
                mariadb_session.query("create database " + config.DBNAME, (err, rows) => {
                    if (!err) {
                        mariadb_session.end();
                        console.log("success create db tasks.");
                        resolve();
                    } else {
                        mariadb_session.end();
                        reject(new InitiateError("An error occurred when create database named " + config.DBNAME));
                    }
                });
            }
        });
    });
}
function setTables() {
    let waitingPromise = [];
    waitingPromise.push(
        queryAsyncSequence([
            "create table `users` (" +
                "`idx` int(10) unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY," +
                "`userid` varchar(15) COLLATE utf8_unicode_ci NOT NULL," +
                "`encryptedpassword` BINARY(32) NOT NULL," +
                "`salt` char(32) COLLATE utf8_unicode_ci NOT NULL," +
                "`creationdate` char(15) COLLATE utf8_unicode_ci NOT NULL)",
            "create table `chatKeysOfUsers` (" +
                "`pid` int(10) unsigned NOT NULL," +
                "`identity` BINARY(33) NOT NULL," +
                "`signedPreKey` BINARY(33)," +
                "`signedPreKeySignature` BINARY(64)," +
                "`preKeys` BLOB," +
                "KEY `userChatKey` (`pid`)," +
                "CONSTRAINT `userChatKey` FOREIGN KEY (`pid`) REFERENCES `users` (`idx`))",
        ])
    );
    return Promise.all(waitingPromise);
}
async function startSetting() {
    await setDatabase();
    await setTables();
    return;
}
module.exports = startSetting;
