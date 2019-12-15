const mouseEmoji = "🐀";

module.exports = function(text) {
	if(text == null || typeof text != "string")
		return null;
		
	if(text.includes("Навыки после апа")) {
		if(text.indexOf(mouseEmoji) == 0) {
			return true;
		}
	}

	return null;
}