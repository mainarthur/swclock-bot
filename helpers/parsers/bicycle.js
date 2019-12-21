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
	
	return false;
}