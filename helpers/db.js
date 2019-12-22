const datastore = require('nedb-promise');

var db = {};

db.users = require("./users.js")(datastore({
	filename: "./data/users.db",
	autoload: true
}));

db.strings = require("./strings.js")(datastore({
	filename: "./data/strings.db",
	autoload: true
}));

db.hashes = require("./hashes.js")(datastore({
	filename: "./data/hashes.db",
	autoload: true
}));

db.startupWarsIds = [
	227859379,
	397823237,
	506821790
]

db.repeatableTimers = [
	"factoryStart",
	"factoryEnd",
	"lotteryStart",
	"lotteryEnd"
]

db.constants = {
	adminId: parseInt(process.env.ADMIN_ID),
	mandarinBotId: 506821790
}


module.exports = db;

String.prototype.replaceAll = function(s, t) {
	return this.split(s).join(t);
}

