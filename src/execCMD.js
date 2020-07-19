module.exports = execute;
const fs = require("fs"),
    crypto = require("crypto"),
    spawn = require("child_process").spawn;

const TMP_DIR_PATH = "/tmp/fromNode/";

function writeFileAsync(path, contents) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, contents, (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}
function unlinkAsync(path) {
    return new Promise((resolve, reject) => {
        fs.unlink(path, contents, (err) => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
}
function tmpCheck(options) {
    let params = options.params,
        tmpfiles = options.tmpfiles,
        files = [],
        waitingPromise = [];
    if (!fs.existsSync(TMP_DIR_PATH)) {
        fs.mkdirSync(TMP_DIR_PATH, 0o700);
    }
    for (let i = 0; i < params.length; i++) {
        if (params[i] === "--TMPFILE--") {
            let tmp_path = TMP_DIR_PATH + crypto.randomBytes(20).toString("hex");
            params[i] = tmp_path;
            waitingPromise.push(writeFileAsync(tmp_path, tmpfiles.shift()));
            files.push(tmp_path);
        }
    }
    return Promise.all(waitingPromise).then(() => {
        return { files: files, params: params };
    });
}

function execute(path, params, tmpfiles) {
    let files = [],
        info;
    let stderr = "",
        exec,
        stdout = "",
        status = 0;
    return new Promise((resolve, reject) => {
        try {
            fs.accessSync(path, fs.X_OK);
            tmpCheck({ params: params, tmpfiles: tmpfiles })
                .then((info) => {
                    files = info.files;
                    exec = spawn(path, info.params);
                    exec.on("exit", (code) => {
                        console.log(code);
                    });
                    exec.on("close", () => {
                        if (status === 1) {
                            resolve(stdout);
                        } else {
                            reject(stderr);
                        }
                    });
                    exec.stdout.on("data", (data) => {
                        status = 1;
                        stdout += data;
                    });
                    exec.stderr.on("data", (data) => {
                        stderr += data;
                    });
                })
                .catch((e) => {
                    reject(e);
                });
        } catch (e) {
            reject(e);
        }
    })
        .then((data) => {
            return Promise.all(
                files.forEach((v, i) => {
                    console.log(v);
                    //unlinkAsync(files[i]);
                })
            );
            //return data;
        })
        .catch((e) => {
            console.log(e);
            for (let i = 0; i < files.length; i++) {
                unlink(files[i]);
            }
            throw e;
        });
}
