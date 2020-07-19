class NetManager{
  constructor(){

  }
  setSocket(server){
    this.server=server;
  }
  isStreamOpen(){
    if(!this.server){
      throw new
    }
    return new Promise((resolve,reject)=>{
      let st="netstat -al";
    })
  }
  listen(cb){
    this.server.listen(cb);
  }
}
module.exports=NetManager;
