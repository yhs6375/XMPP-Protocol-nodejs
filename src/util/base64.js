function encode(bytes){
  if(!bytes){
    return;
  }
  if(typeof bytes==='string'||bytes.constructor.name==='Buffer'){
    return Buffer.from(Buffer.from(bytes).toString('base64'));
  }
}
function decode(bytes,encoding){
  if(!bytes){
    return;
  }
  if(typeof bytes!=='string'){
    if(!encoding){
      encoding="utf8";
    }
    if(bytes.toString)bytes=bytes.toString(encoding);
    else return;
  }
  return Buffer.from(bytes,'base64');
}
function encodeToString(bytes){
  if(!bytes){
    return;
  }
  if(typeof bytes==='string'||bytes.constructor.name==='Buffer'){
    return Buffer.from(bytes).toString('base64');
  }
}
function decodeToString(bytes,encoding){
  if(!bytes){
    return;
  }
  if(typeof bytes!=='string'){
    if(!encoding){
      encoding="utf8";
    }
    if(bytes.toString)bytes=bytes.toString(encoding);
    else return;
  }
  return Buffer.from(bytes,'base64').toString();
}
module.exports={
  encode,
  encodeToString,
  decode,
  decodeToString
}
