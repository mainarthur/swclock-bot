const dogEmoji = "🐕";

module.exports = function(text) {
	if(text == null || typeof text != "string")
		return null;
		
	if(text.includes("Навыки после апа")) {
		if(text.indexOf(dogEmoji) == 0) {
			return true;
		}
	}

	return null;
}