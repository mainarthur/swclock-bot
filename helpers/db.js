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



db.constants = {
}


module.exports = db;
