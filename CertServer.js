const net=require('net');
const certificateManager=require('./HS-make-client-cert');

const tcp_server=net.createServer(c=>{
  console.log('client connect');
  c.on('data',async data=>{
    try{
      let result=await certificateManager.make(data);
      c.write(Buffer.concat([Buffer.from([1]),Buffer.from(result)]));
    }catch(e){
      c.write(Buffer.from([0x02]));
    }
  })
  c.on('end', () => {
    console.log('client disconnected');
  });
})
tcp_server.on('error', (err) => {
  throw err;
});
tcp_server.listen(8109, () => {
  console.log('server bound');
});
