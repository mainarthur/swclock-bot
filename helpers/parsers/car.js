/*
🚕Ааавтомобиль остывает с предыдущей поездки ещё 4ч. 55 мин.
Приходи, когда остынет.
*/


module.exports = function(text) {
	if(text == null || typeof text != "string")
		return false;
		
	if(text.indexOf("🚕Ааавтомобиль остывает с предыдущей поездки ещё") == 0) {
		if(text.includes("Приходи, когда остынет."))
			return true;
	}
	
	if(text.indexOf("Выехал покататься. Перед поездкой пришлось потратить на это ведро с гайками 8🔩 и заправиться на 20 💵. Вернёшься через 10 минут.") == 0) {
		return true;
	}
	
	return false;
}