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

db.startupWarsIds = [
	227859379,
	397823237
]

db.constants = {
	adminId: 295162096
}


module.exports = db;

String.prototype.replaceAll = function(s, t) {
	return this.split(s).join(t);
}

