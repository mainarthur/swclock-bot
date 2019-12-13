var user_reg = /(🤖|🎩|⚡️|📯|☂️)(.*)\s\((\d+)\)\n🔨(\d+)\s🎓(\d+)\s🐿(\d+)\s🐢(\d+)/
var prodavanReward = {
	'exp': /💡Опыт:\s\+(\d+)/,
	'money': /💵\sДеньги:\s\+\$(\d+)/,
	'knowledge': /📚\sЗнания:\s\+(\d+)/,
	'details': {
		'normal': /⚙️\sДетали:\s\+(\d+)/,
		'VIP': /⚙️\sДетали\sза\s⚫️\sVIP\sсет:\s\+(\d+)/
	},
	'boxes': {
		'standart': /Вау,\sвот\sэто\sудача!\sПродаван,\sубегая,\sобронил\s🎁Призовую\sкоробку./,
        'lamp': /Благодаря\sФонарю\s🔦Sw-eт\sтебе\sудалось\sотыскать\sоброненую\s🎁Призовую\sкоробку./
	},
	'upgrades': {
		'white': /⚪️\sУлучшения:\s\+(\d+)\n/,
        'whiteLamp': /⚪️\sУлучшения:\s\+(\d+)\s\(сработал\s🔦Sw-eт\)/,
        'blue': /🔵\sУлучшения:\s\+(\d+)\n/,
        'red': /🔴\sУлучшения:\s\+(\d+)\n/
	}
}

module.exports = function(text) {
	if(text == null || typeof text != "string")
		return null;
		
	if(text.indexOf("⚔Битва с продаваном") == 0) {
		var res = {
			hero: {
				power: {}
			},
			statistics: {
				
			}
		}
		let m = text.match(user_reg);
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
		
		
		
	} else {
		return null;
	}
}