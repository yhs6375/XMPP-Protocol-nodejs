const createHash=require('crypto').createHash,
      createHmac = require('crypto').createHmac;
exports.H=(text)=>{
  return createHash('sha256').update(text).digest();
};
exports.HMAC=(key,text)=>{
  return createHmac('sha256',key).update(text).digest();
}
