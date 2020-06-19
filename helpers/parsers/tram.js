/*
🚜Трактор остывает с предыдущей поездки ещё 3ч. 39 мин.
Приходи, когда остынет.

*/


module.exports = function(text) {
	if(text == null || typeof text != "string")
		return false;
		
		
	if(text.indexOf("Выехал на личном 🚃Трамвае") == 0) {
		return true;
	}
	
	
	if(text.indexOf("🚃Трамвай") == 0) {
		if(text.includes("Приходи, когда отдохнёт."))
			return true;
	}
	
	return false;
}
