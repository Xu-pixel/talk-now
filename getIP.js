const os = require('os')

module.exports = () => {
    var ifaces = os.networkInterfaces();
    return Object.keys(ifaces).reduce((p, c) =>
        p.concat(ifaces[c].filter(i => !i.internal && 'IPv4' == i.family).map(i => i.address)), []);
}