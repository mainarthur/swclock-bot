/*
🚜Трактор остывает с предыдущей поездки ещё 3ч. 39 мин.
Приходи, когда остынет.

*/


module.exports = function(text) {
	if(text == null || typeof text != "string")
		return false;
		
	if(text.indexOf("🚜Трактор остывает с предыдущей поездки ещё") == 0) {
		if(text.includes("Приходи, когда остынет."))
			return true;
	}
	
	return false;
}