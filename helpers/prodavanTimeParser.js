var timeRegEx = /Приходи\sчерез\s(\d+ч)\.\s(\d+\sмин)/

module.exports = function(text) {
	if(text == null || typeof text != "string")
		return null;
	
	if(!text.includes("Всё, ты одолел последнего Продавана"))
		return 60*60*1000;
	
	let match = text.match(timeRegEx);
	
	if(match == null)
		return null;

	let time = 0;
	for(let i = 1; i < match.length; i++) {
		let m = match[i];
		if(m.includes("мин")) {
			console.log(m);
			console.log(parseInt(m)*60*1000)
			time += parseInt(m)*60*1000;
		} else if(m.includes("ч")) {
			console.log(m);
			console.log(parseInt(m)*60*60*1000)
			time += parseInt(m)*60*60*1000;
		}
	}
	
	return ( time == 0 || Number.isNaN(time) ) ? null : time;
}