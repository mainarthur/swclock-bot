/*

Ты не можешь кататься на 🚲Велосипеде ещё 8ч. 5 мин.
Подкопи силёнок.

*/

module.exports = function(text) {
	if(text == null || typeof text != "string")
		return false;
		
	if(text.indexOf("Ты не можешь кататься на 🚲Велосипеде") == 0) {
		if(text.includes("Подкопи силёнок."))
			return true;
	}
	
	if(text.indexOf("Выехал покататься. Перед поездкой починил 🚲Велик и потратил 5🔩. Вернёшься через 10 минут.") == 0) {
		return true;
	}
	
	return false;
}