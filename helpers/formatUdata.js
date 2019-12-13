module.exports = function (userinfo) {
	userinfo.first_name = userinfo.first_name ? userinfo.first_name.substr(0,150).replaceAll("<", "&lt;") : userinfo.first_name;
	userinfo.last_name = userinfo.last_name ? userinfo.last_name.substr(0,150).replaceAll("<", "&lt;") : userinfo.last_name;
}