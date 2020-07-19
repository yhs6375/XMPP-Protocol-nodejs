module.exports.make=makeCertificate;

var openssl=require('./hosung_module/hs-openssl');
openssl("/usr/bin/openssl");
var fs=require('fs');
var Promise=require('bluebird');

var readFileAsync=Promise.promisify(fs.readFile);
async function makeCertificate(clientCsr){
  var option={
    days:365,
    password:'a644260'
  };
  //Promise.join(readFileAsync('test2/ca.crt'),readFileAsync('test2/ca.key'),readFileAsync('test2/client.csr'),(CAcrt,CAkey,clientCsr)=>{
  Promise.join(readFileAsync('test2/ca.crt'),readFileAsync('test2/ca.key'),(CAcrt,CAkey)=>{
    option.CAcrt=CAcrt;
    option.CAkey=CAkey;
    option.clientCsr=clientCsr;
  }).then(()=>{
    return openssl.createSelfSignedCertificate(option);
  }).then((result)=>{
    console.log("success : "+result);
  })
  .catch(err=>{
    console.log("Error:"+err);
  })
}
