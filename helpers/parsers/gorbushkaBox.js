module.exports = function(text) {
	if(text == null || typeof text != "string")
		return false;
		
	if(text.includes("Заскочил на обратном пути на 🏛Горбушку. Рынок уже закрывался, но тебе удалось найти возле одной из лавок 🎁Призовую коробку.")) {
		return true;
	}

	return false;
}