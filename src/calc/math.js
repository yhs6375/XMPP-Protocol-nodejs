function xor(a,b){
  if(typeof a==='string'){
    a=Buffer.from(a);
  }
  if(typeof b==='string'){
    b=Buffer.from(b);
  }
  let result=[],diff,dummy,i,
      al=a.length,
      bl=b.length;
  diff=Math.abs(al-bl);
  if(al>bl){
    for(i=0;i<diff;i++){
      result.push(a[i]);
    }
    for(let j=0;i<al;i++,j++){
      result.push(a[i]^b[j]);
    }
  }else if(al<bl){
    for(i=0;i<diff;i++){
      result.push(b[i]);
    }
    for(let j=0;i<bl;i++,j++){
      result.push(a[j]^b[i]);
    }
  }
  return Buffer.from(result);
}
module.exports={
  xor
}
