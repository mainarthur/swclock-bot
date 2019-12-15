const timeRegEx = /(\d+ч\.)|(\d+\sмин)/g

var t = `🐕этого казино

Навыки после апа
🍀Удача: 1
👓Интеллект: 1
🔋Выносливость: 5
❤️Преданность: 3
🔧Профи: 1

👍Прокачал 🔋Выносливость.

Потратил
💵Деньги: $125

🐕 теперь отдыхает после апа 25 мин.
Но ты можешь угостить его 🍞 за 2🌐 (/dog_rest) и пет закончит отдых мгновенно.`;

function petTimeParser(text) {
	if(text == null || typeof text != "string")
		return null;
	
	let match = text.match(timeRegEx);
	console.log(match)
	if(match == null)
		return null;

	let time = 0;
	for(let i = 0; i < match.length; i++) {
		let m = match[i];
		if(m != null) {
			if(m.includes("мин") && !m.includes("ч")) {
				time += parseInt(m)*60*1000;
			} else if(m.includes("ч") && !m.includes("мин")) {
				time += parseInt(m)*60*60*1000;
			}
		}
	}
	
	return ( time == 0 || Number.isNaN(time) ) ? null : time;
}


module.exports = petTimeParser;