exports.parse = function (chal) {
    var dtives = {};
    var tokens = chal.split(',');
    for (let i = 0, len = tokens.length; i < len; i++) {
        let dtiv = /(\w)=(.*)$/.exec(tokens[i]);
        if (dtiv) {
            dtives[dtiv[1]] = dtiv[2];
        }
    }
    return dtives;
};
