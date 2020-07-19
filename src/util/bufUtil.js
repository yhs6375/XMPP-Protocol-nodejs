function split(buf,splitStr){
  if(typeof buf==='string'){
    buf=Buffer.from(buf);
  }
  let res=[],
      split=Buffer.from(splitStr),
      n=0,start=0,end=0,i=0
      everMatch=false;
  for(;i<buf.length;i++,end++){
    if(buf[i]==split[n]){
      n++;
      if(n>=split.length){
        res.push(buf.slice(start,i-n+1))
        everMatch=true;
        start=i+1;
      }
    }else{
      n=0;
    }
  }
  if(everMatch){
    res.push(buf.slice(start,i+1))
  }
  return res;
}
module.exports={
  split
}
