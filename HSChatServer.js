const HSChat = require("./src/hschat");

let HSChatServer = new HSChat({
    port: 5222,
    domain: "localhost",
    tls: {
        a: 33,
    },
});
HSChatServer.on("connect", function (client) {
    client.on("register", (id) => {
        console.log("Register Success: " + id);
    });
    client.on("online", function () {
        console.log("ONLINE");
        console.log(HSChat.Message);
        client.send(new HSChat.Message({ type: "chat" }).c("body").t("Hello client."));
        console.log("ONLINE END");
    });

    client.on("stanza", function (stanza) {
        console.log("STANZA" + stanza);
    });
    client.on("error", (msg) => {
        console.log(msg);
    });
    client.on("disconnect", function (client) {
        console.log("DISCONNECT");
    });
});
