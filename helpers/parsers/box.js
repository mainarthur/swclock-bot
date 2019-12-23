module.exports = function(text) {
	if(text == null || typeof text != "string")
		return false;
		
	if(text.includes("❌Ты пока не подобрал код к призовой")) {
		return true;
	}

	return false;
}