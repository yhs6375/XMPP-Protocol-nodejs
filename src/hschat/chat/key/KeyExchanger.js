function getBobsPreKey(bob_id){
  for(let i=0;i<len;i++){
    let id,id_size,pre_key,cur=0;
    for(;cur<data.length;cur++){
      if(data[cur]===0x05){
        break;
      }
      id+=data[cur];
    }
    id=parseInt(id.toString(),10);
    pre_key=data.slice(cur,cur+33);
    this.keyDatas.preKeys.push(pre_key);
    data=data.slice(cur+33);
  }
}
