class HSError{
  constructor(message){
    this.message=message;
  }
  toString(){
    if(!this.name){
      return 'HSError : "'+this.message+'"';
    }else{
      return this.name+' : "'+this.message+'"';
    }
  }
}
class InitiateError extends HSError{
  constructor(message){
    super(message);
  }
}
class DevelopError extends HSError{
  constructor(message){
    super(message);
  }
}
class HSChatError extends HSError{
  constructor(message){
    super(message);
  }
}
class DBError extends HSError{
  constructor(message){
    super(message);
  }
}
class RegistrationError extends HSChatError{
  /*
  Error Type
  1=undefined error
  2=duplicate id error
  3=invalid password error
  4=account db insert error
  */
  constructor(errType,message){
    super(message);
    this.errType=errType;
  }
}
class HSChatParseError extends HSChatError{
  constructor(message){
    super(message);
  }
}
class HSChatSecureError extends HSChatError{
  constructor(message){
    super(message);
  }
}
class HSChatAuthError extends HSChatError{
  /*
  Error type
  1=undefined error
  2=unknown mechanism error
  3=unregist id
  4=mismatch password
  5=already login
  6=userData broken
  7=illegal login state
  */
  constructor(errType,message){
    super(message);
    this.errType=errType;
  }
}
class HSChatKeyError extends HSChatError{
  /*
  Error definition
  1==undefined error
  2==when regist time error
  */
  constructor(errType,message){
    super(message);
    this.errType=errType;
  }
}

module.exports={
  HSError,
  DevelopError,
  DBError,
  HSChatError,
  HSChatParseError,
  HSChatSecureError,
  HSChatAuthError,
  HSChatKeyError,
  RegistrationError,
  InitiateError
}
