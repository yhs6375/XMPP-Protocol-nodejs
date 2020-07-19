/*const 변수명=require(this module).rack() 후
변수명() - 랜덤ID 생성
변수명(저장할 정보) - 랜덤ID 생성과 동시에 정보 저장
변수명.get(생성된ID) - 해당 ID에 저장된 정보가져오기
변수명.set(생성된ID,저장할 정보) - 해당 ID에 정보 저장*/

var main = module.exports = function (bits, base) {
  if(!base)base=16;
  if(bits===undefined)bits=128;
  if(bits<=0)return '0';
  let digits=Math.log(Math.pow(2,bits)) / Math.log(base);
  for(var i=2;digits===Infinity;i*=2) {
    digits = Math.log(Math.pow(2, bits / i)) / Math.log(base) * i;
  }
  let rem=digits - Math.floor(digits);
  let res='';

  for(let i=0;i<Math.floor(digits);i++){
    let x=Math.floor(Math.random() * base).toString(base);
    res=x+res;
  }
  if(rem){
    let b=Math.pow(base,rem);
    let x=Math.floor(Math.random() * b).toString(base);
    res=x+res;
  }

  let parsed = parseInt(res, base);
  if(parsed !== Infinity && parsed >= Math.pow(2, bits)) {
    return main(bits, base)
  }else return res;
};

main.rack = function (bits, base, expandBy) {
  let id;
  let fn=data=>{
    let iters=0;
    do{
      if(iters++ > 10){
        if(expandBy) bits += expandBy;
        else throw new Error('too many ID collisions, use more bits')
      }
      id=main(bits, base);
    }while (Object.hasOwnProperty.call(hats, id));
    hats[id] = data;
    return id;
  };
  let hats = fn.hats = {};
  fn.get=id=>{
    return fn.hats[id];
  };
  fn.set=(id, value)=>{
    fn.hats[id] = value;
    return fn;
  };
  return fn;
};
