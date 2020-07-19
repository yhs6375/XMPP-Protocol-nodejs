class Error{
  constructor(message){
    this.message=message;
  }
  toString(){
    if(!this.name){
      return 'Error : "'+this.message+'"';
    }else{
      return this.name+' : "'+this.message+'"';
    }
  }
}
