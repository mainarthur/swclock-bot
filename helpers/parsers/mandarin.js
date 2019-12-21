/* ❌А ты знаешь, что мандаринки нельзя разбрасывать так часто? Ты можешь слать мандарины не чаще 1-го раза за 20 часов. Сможешь отправить новые через 15ч.*/

module.exports = function(text) {
	if(text == null || typeof text != "string")
		return false;
		
	if(text.includes("❌А ты знаешь, что мандаринки нельзя разбрасывать так часто?")) {
		return true;
	}

	return false;
}