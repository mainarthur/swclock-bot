const metroReward = {
	'money': /💵Деньги:\s(\d+)/,
	'tokens': /🕳Жетоны:\s(\d+)/,
	'bolts': /🔩Сырьё:\s(\d+)/,
	'knowledge': /📚Знания:\s(\d+)/,
	'details': /Детали:\s(\d+)/,
	'burgers': /🍔Бургер:\s(\d+)/,
	'pizzas': /🍕Пицца:\s(\d+)/,
	'hotdogs': /🌭Хотдог:\s(\d+)/,
}
const upgrades =  {
	'white': /⚪️Улучшения:\s(\d+)/,
	'blue': /🔵Улучшения:\s(\d+)/,
	'red': /🔴Улучшения:\s(\d+)/
}

module.exports = function(text) {
	if(text == null || typeof text != "string")
		return null;
		
	if(text.indexOf("Ты вышел из метро досрочно.") == 0 || text.indexOf("Получено") == 0 || text.indexOf("Тебя завалило обрушившимся потолком, но спасатели вовремя тебя вытащили. В награду они забрали две трети найденного.") == 0) {
		let res = {
			statistics: {
				upgrades: {}
			}
		};
		
		if(text.indexOf("Тебя завалило обрушившимся потолком, но спасатели вовремя тебя вытащили. В награду они забрали две трети найденного.") == 0) {
			text = text.substr(text.indexOf("Получено"));
		}
		
		if(text.indexOf("Ты вышел из метро досрочно.") == 0) {
			res.statistics.atime = 1;
		} else {
			res.statistics.intime = 1;
		}
		
		let regexes = Object.keys(metroReward);
		
		for(let i = 0; i < regexes.length; i++) {
			let reg = metroReward[regexes[i]];
			
			let m = text.match(reg);
			console.log(m);
			if(m != null) {
				if(m[1] != null && !Number.isNaN(parseInt(m[1]))) {
					res.statistics[regexes[i]] = parseInt(m[1]);
				}
			}
		}
		
		regexes = Object.keys(upgrades);
		
		for(let i = 0; i < regexes.length; i++) {
			let reg = upgrades[regexes[i]];
			
			let m = text.match(reg);
			console.log(m);
			if(m != null) {
				if(m[1] != null && !Number.isNaN(parseInt(m[1]))) {
					res.statistics.upgrades[regexes[i]] = parseInt(m[1]);
				}
			}
		}
		
		return res;
		
	}

	return null;
}