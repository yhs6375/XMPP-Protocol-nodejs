const bcrypt=require('bcrypt');

const SALT_ROUNDS=10;
class Bcrypt{
  static async encrypt(pw){
    return new Promise((resolve,reject)=>{
      bcrypt.genSalt(SALT_ROUNDS,(err,salt)=>{
        bcrypt.hash(pw,salt,(err,hash)=>{
          resolve({salt,hash});
        })
      })
    })
  }
  static async compare(){

  }
}

module.exports=Bcrypt;
