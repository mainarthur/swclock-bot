const timeRegEx = /(\d+ч\.)|(\d+\sмин)/g


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