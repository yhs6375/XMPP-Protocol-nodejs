const createHash = require('crypto').createHash,
      createHmac = require('crypto').createHmac;

exports.H=(text)=>{
  return createHash('sha256').update(text).digest();
};

exports.HMAC=(key,msg)=>{
  return createHmac('sha256',key).update(msg).digest();
};

exports.Hi=(text,salt,iterations)=>{
  let ui1=exports.HMAC(text, Buffer.concat([salt, Buffer.from([0, 0, 0, 1])]));
  let res=ui1;
  for (let i = 0; i < iterations-1; i++) {
    ui1 = exports.HMAC(text, ui1);
    for(let j=0;j<ui1.length;j++){
      res[j]^=ui1[j];
    }
  }
  return res;
};
/*function xor(a,b){
  let result=[];
  if (a.length>b.length) {
    for(let i=0;i<b.length;i++){
      result.push(a[i]^b[i]);
    }
  }else{
    for(let i=0;i<a.length;i++){
      result.push(a[i]^b[i]);
    }
  }
  return Buffer.from(result);
}*/
function xor(a,b){
  let result=[],div,dummy,
      al=a.length,
      bl=b.length;
  console.log(al);
  console.log(bl);
  div=Math.abs(al-bl);
  if(al>bl){
    dummy=Buffer.allocUnsafe(div).fill(0);
    console.log(dummy);
    b=buffer.concat([dummy,b]);
  }else{
    dummy=Buffer.allocUnsafe(div).fill(0);
    console.log(dummy);
    b=buffer.concat([dummy,a]);
  }
  for(let i=0;i<a.length;i++){
    result.push(a[i]^b[i]);
  }
  return Buffer.from(result);
}
