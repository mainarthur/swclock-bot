// Парсинг подобный петам
let pets = require("./petTime.js");

module.exports = function(text) {
	if(text.indexOf("Выехал покататься. Перед поездкой пришлось потратить на это ведро с гайками 8🔩 и заправиться на 20 💵. Вернёшься через 10 минут.") == 0) {
		return 10*60*1000 + 20*60*60*1000;
	}
	if(text.indexOf("Выехал покататься. Перед поездкой починил 🚲Велик и потратил 5🔩. Вернёшься через 10 минут.") == 0) {
		return 10*60*1000 + 23*60*60*1000;
	}
	if(text.indexOf("Отправился кататься на 🚜Тракторе. Перед поездкой починил его за 10🔩 и потратил на диз. топливо 30 💵. Вернёшься через 10 минут.") == 0) {
		return 10*60*1000 + 19*60*60*1000;
	}
	if(text.indexOf("Поехал кататься на 🛴Самокате") == 0) {
		return 10*60*100 + 5*60*60*1000;
	}
	return pets(text);
}