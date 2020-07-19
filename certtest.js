var pem=require('pem'),
	fs=require('fs'),
	option={
		//clientKey:fs.readFileSync('test2/client.key'),
		csr:fs.readFileSync('test2/client.crt'),
		days:365,
		selfSigned:true
	}
pem.createCertificate(option,(err,keys)=>{
	console.log(err);
	console.log(keys);
})
