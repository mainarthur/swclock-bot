module.exports = function (user) {
	return "<a href=\"tg://user?id=" + user.id.toString() + "\">" + user.first_name + (user.last_name == null ? "" : " " + user.last_name) + "</a>"
}