function random(low,high){
  return Math.floor(Math.random()*(high-low)+low);
}
function randomASCII(length,low,high){
  let n,
      result='';
  for(let i=0;i<length;i++){
    n=random(low,high);
    if(n===44){
      --i;
    }else{
      result+=String.fromCharCode(n);
    }
  }
  return result;
}
module.exports={
  randomASCII
}
