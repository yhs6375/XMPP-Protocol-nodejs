'use strict'
const EventEmitter = require('events').EventEmitter

class Mechanism extends EventEmitter{
  constructor(){
    super()
    this.userData={};
  }
  success(){}
  failure(){}
  authenticate(){}
  parseFirstMessage(){}
  extractSasl(){
    throw new Error('This is an abstract method, you should overrride it')
  }
}
module.exports = Mechanism
