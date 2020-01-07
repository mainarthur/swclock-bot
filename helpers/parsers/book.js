
module.exports = function(text) {
	if(text == null || typeof text != "string")
		return null;
		
	if(text.includes("Ты прочёл 📒Книгу"))
		return true;
		
	return false;
}