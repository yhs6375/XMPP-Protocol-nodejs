'use strict'
const Mechanism = require('./Mechanism')

class Plain extends Mechanism{
  constructor(){
    super();
  }
  extractSasl(auth){
    let params = auth.split('\x00'),
    authRequest = {
      'username': params[1],
      'password': params[2]
    }
    return authRequest
  }
}
Object.defineProperty(Plain,'name',{
  value:'PLAIN',
  writable : false,
  enumerable : true,
  configurable : false
});
module.exports = Plain
