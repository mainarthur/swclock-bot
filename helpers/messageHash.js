const crypto = require('crypto');

module.exports = function(msg) {
	let data = msg.text + msg.forward_date;
	
	return crypto.createHash('md5').update(data).digest("hex");
}