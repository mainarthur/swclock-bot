const log_bot = require('./logbot.js');
const log_cid = -1001481847853;


function log(data) {
	useDeault = true;
	if (typeof data == "object")
		return log_bot.sendMessage(log_cid, "[" + Date().match(/\d+:\d+:\d+/)[0] + "] " + JSON.stringify(data).substr(0,4000), {
			parse_mode: "html",
			disable_web_page_preview: true
		});
	if (data == null)
		return log_bot.sendMessage(log_cid, "[" + Date().match(/\d+:\d+:\d+/)[0] + "] null");
	log_bot.sendMessage(log_cid, "[" + Date().match(/\d+:\d+:\d+/)[0] + "] " + data.toString().substr(0, 4000), {
		parse_mode: "html",
		disable_web_page_preview: true
	});
}

module.exports = log;
