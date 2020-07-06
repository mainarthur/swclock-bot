
module.exports = function (text) {
	if (text == null || typeof text != "string")
		return null;

	if (text.indexOf("Пета нельзя менять ещё") == 0) {
		return true;
	}


	return null;
}