module.exports = new (require("node-telegram-bot-api"))(process.env.BOT_TOKEN, {
	polling:true
});