module.exports.make=makeCertificate;

const openssl=require('./hosung_module/hs-openssl');
openssl("/usr/bin/openssl");
const fs=require('fs');

function readFileAsync(path){
	return new Promise((resolve,reject)=>{
		fs.readFile(path,(err,data)=>{
			if(err)reject(err);
			resolve(data);
		})
	})
}
async function makeCertificate(clientCsr){
  let option={
    days:365,
    password:'a644260'
  },CAcrt,CAkey;
	CAcrt=readFileAsync('test2/ca.crt');
	CAkey=readFileAsync('test2/ca.key');
  option.CAcrt=await CAcrt;
  option.CAkey=await CAkey;
  option.clientCsr=clientCsr;
	return await openssl.createSelfSignedCertificate(option);
}
