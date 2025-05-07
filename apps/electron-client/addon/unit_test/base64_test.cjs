const addon = require('../build/Release/mailio_addon.node');

const base64 = new addon.Base64Wrapper();
const result = base64.encode("Hello, World!");
console.log(result);

console.log(base64.decode(result));