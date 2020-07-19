module.exports=openssl;
module.exports.createSelfSignedCertificate=createSelfSignedCertificate;
const fs=require('fs'),
			crypto = require('crypto'),
			spawn = require('child_process').spawn;

const TEMP_PATH = process.env.TMPDIR||process.env.TMP||process.env.TEMP ||'/tmp';
const NODE_TMP_DIR_PATH=TEMP_PATH+"/fromNode/";
let OPENSSL_PATH;

function writeFileAsync(path,contents){
	return new Promise((resolve,reject)=>{
		fs.writeFile(path,contents,(err)=>{
			if(err){
				reject(err);
			}
			resolve();
		})
	})
}
function unlinkAsync(path){
	return new Promise((resolve,reject)=>{
		fs.unlink(path,(err)=>{
			if(err){
				if(err.code=='ENOENT'){
					resolve();
				}
				reject(err);
			}
			resolve();
		})
	})
}
function tmpCheck(options){
	let params=options.params,
			tmpfiles=options.tmpfiles,
			files=[],
			waitingPromise=[];
	if(!fs.existsSync(NODE_TMP_DIR_PATH)){
		fs.mkdirSync(NODE_TMP_DIR_PATH,0o700);
	}
	for(let i=0;i<params.length;i++){
		if(params[i]==="--TMPFILE--"){
			let tmp_path=NODE_TMP_DIR_PATH+crypto.randomBytes(20).toString('hex');
			params[i]=tmp_path;
			waitingPromise.push(writeFileAsync(tmp_path,tmpfiles.shift()));
			files.push(tmp_path);
			if(params[i-1]==="-CA"){
				files.push(tmp_path+".srl");
			}
		}
	}
	return Promise.all(waitingPromise).then(()=>{
		return {files:files,params:params};
	})
}

function execute(path,params,tmpfiles){
	let files=[],info;
	let stderr='',
			exec,
			stdout='',
			status=0;
	return new Promise((resolve,reject)=>{
		try{
			fs.accessSync(path,fs.X_OK);
			tmpCheck({params:params,tmpfiles:tmpfiles}).then(info=>{
				files=info.files;
				exec=spawn(path,info.params);
				exec.on('exit',code=>{
				})
				exec.on('close',()=>{
					if(status===1){
						resolve(stdout);
					}else{
						reject(stderr);
					}
				})
				exec.stdout.on('data',data=>{
					status=1;
					stdout+=data;
				});
				exec.stderr.on('data',data=>{
					stderr+=data;
				});
			}).catch(e=>{
				reject(e);
			})
		}catch(e){
			reject(e);
		}
	}).then(data=>{
		return Promise.all(files.map((target,i)=>{
			return unlinkAsync(target);
		})).then(()=>{
			return data;
		});
	}).catch(e=>{
		return Promise.all(files.map((target,i)=>{
			return unlinkAsync(target);
		})).then(()=>{
			throw e;
		});
	})
}

function openssl(path){
	OPENSSL_PATH=path;
}
function createSelfSignedCertificate(options){
	if(!options.clientCsr||!options.CAcrt||!options.CAkey){
		throw "you have to insert Certificate information.";
	}
	var params=['x509','-req','-sha256','-days',options.days,
		'-in','--TMPFILE--',
		'-CA','--TMPFILE--',
		'-CAkey','--TMPFILE--',
		'-CAcreateserial'
	],
		tmpfiles=[options.clientCsr,options.CAcrt,options.CAkey]
	if(options.password){
		params.push('-passin');
		params.push('pass:'+options.password);
	}

	return execute(OPENSSL_PATH,params,tmpfiles);
}
