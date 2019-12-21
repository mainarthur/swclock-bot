const mouseEmoji = "🐀";

module.exports = function(text) {
	if(text == null || typeof text != "string")
		return false;
		
	if(text.includes("отдыхает после апа")) {
		if(text.indexOf(mouseEmoji) == 0) {
			return true;
		}
	}

	return false;
}