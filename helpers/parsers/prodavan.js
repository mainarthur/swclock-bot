var userReg = /(🤖|🎩|⚡️|📯|☂️)(.*)\s\((\d+)\)\n🔨(\d+)\s🎓(\d+)\s🐿(\d+)\s🐢(\d+)/;

var prodavanReward = {
	'experience': /💡Опыт:\s\+(\d+)/,
	'money': /💵\sДеньги:\s\+\$(\d+)/,
	'knowledge': /📚\sЗнания:\s\+(\d+)/,
}

var details = {
	'standart': /Детали:\s\+(\d+)/,
	'VIP': /Детали\sза\s⚫️ VIP\sсет:\s\+(\d+)/
}

var boxes = {
	'standart': /Вау,\sвот\sэто\sудача!\sПродаван,\sубегая,\sобронил\s🎁Призовую\sкоробку./,
    'lamp': /Благодаря\sФонарю\s🔦Sw-eт\sтебе\sудалось\sотыскать\sоброненую\s🎁Призовую\sкоробку./
}

var upgrades = {
	'white': /⚪️\sУлучшения:\s\+(\d+)\n/,
	'whiteLamp': /⚪️\sУлучшения:\s\+(\d+)\s\(сработал\s🔦Sw-eт\)/,
	'blue': /🔵\sУлучшения:\s\+(\d+)\n/,
	'red': /🔴\sУлучшения:\s\+(\d+)\n/
}

var items = {
	'screen': /📟Экран/,
	'circuit': /📟Плата/,
	'blade': /✂️Лезвие/,
	'rings': /✂️Колечко/
}

module.exports = function(text) {
	if(text == null || typeof text != "string")
		return null;
		
	if(text.indexOf("⚔Битва с продаваном") == 0) {
		let res = {
			hero: {
				power: {}
			},
			statistics: {
				boxes: {},
				upgrades: {},
				details: {},
				items: {}
			}
		}
		
		let m = text.match(userReg);
		
		if(m == null) {
			return;
		}
		
		res.hero.corp = m[1];
		res.hero.nickname = m[2];
		res.hero.level = parseInt(m[3]);
		res.hero.power.practice = parseInt(m[4]);
		res.hero.power.theory = parseInt(m[5]);
		res.hero.power.cunning = parseInt(m[6]);
		res.hero.power.wisdom = parseInt(m[7]);
		
		let isVictory = text.indexOf("Ты успешно одолел продавана. Он бежал, но оставил после себя часть вещей.") != -1;
		
		if(isVictory) 
			res.statistics.victories = 1
		else 
			res.statistics.defeats = 1;
		
		let regexes = Object.keys(prodavanReward);
		
		for(let i = 0; i < regexes.length; i++) {
			let reg = prodavanReward[regexes[i]];
			
			let m = text.match(reg);
			if(m != null) {
				if(m[1] != null && !Number.isNaN(parseInt(m[1]))) {
					res.statistics[regexes[i]] = parseInt(m[1]);
				}
			}
		}
		
		regexes = Object.keys(details);
		
		for(let i = 0; i < regexes.length; i++) {
			let reg = details[regexes[i]];
			
			let m = text.match(reg);
			if(m != null) {
				if(m[1] != null && !Number.isNaN(parseInt(m[1]))) {
					res.statistics.details[regexes[i]] = parseInt(m[1]);
				}
			}
		}
		
		regexes = Object.keys(upgrades);
		
		for(let i = 0; i < regexes.length; i++) {
			let reg = upgrades[regexes[i]];
			
			let m = text.match(reg);
			if(m != null) {
				if(m[1] != null && !Number.isNaN(parseInt(m[1]))) {
					res.statistics.upgrades[regexes[i]] = parseInt(m[1]);
				}
			}
		}
		
		regexes = Object.keys(boxes);
		
		for(let i = 0; i < regexes.length; i++) {
			let reg = boxes[regexes[i]];
			
			let m = text.match(reg);
			if(m != null) {
				res.statistics.boxes[regexes[i]] = 1;
			}
		}


		regexes = Object.keys(boxes);
		
		for(let i = 0; i < regexes.length; i++) {
			let reg = boxes[regexes[i]];
			
			let m = text.match(reg);
			if(m != null) {
				res.statistics.boxes[regexes[i]] = 1;
			}
		}
		

		regexes = Object.keys(items);
		
		for(let i = 0; i < regexes.length; i++) {
			let reg = items[regexes[i]];
			
			let m = text.match(reg);
			if(m != null) {
				res.statistics.items[regexes[i]] = 1;
			}
		}

		return res;
	} else {
		return null;
	}
}