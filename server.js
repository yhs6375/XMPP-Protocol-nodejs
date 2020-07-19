const xmpp=require("node-xmpp-server"),
	fs=require("fs");

let c2s=new xmpp.C2SServer({
	port:5222,
	domain:'localhost',
	requestCert:true,
	rejectUnauthorized:true,
	tls:{
		a:33
	}
})
c2s.on("connect", function(client) {
	console.log("~~~~~")
    c2s.on("register", function(opts, cb) {
      console.log("REGISTER");
    	cb(true);
    })

    client.on("authenticate", function(opts, cb) {
			console.log("authenticate !!!!")
    	console.log(opts);
    	console.log(cb);
        console.log("AUTH" + opts.jid + " -> " +opts.password);
        cb(null,opts);
    });

    client.on("online", function() {
        console.log("ONLINE");
        //client.send(new xmpp.Message({ type: 'chat' }).c('body').t("Hello there, little client."));
    });

    client.on("stanza", function(stanza) {
        console.log("STANZA" + stanza);

    });

    client.on("disconnect", function(client) {
        console.log("DISCONNECT");
    });
});
