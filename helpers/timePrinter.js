const timeRegEx = /(\d{2}):(\d{2}):(\d{2})/;

function timePrinter(milliseconds) {
	let date = new Date(null);
	date.setTime(milliseconds);
	
	let str = date.toUTCString();
	let match = str.match(timeRegEx);
	
	if(match == null) {
		console.log("[timePrinter] str = " + str);
		return "Что-то пошло не так";
	}
	
	let hours = match[1];
	let minutes = match[2];
	let seconds = match[3];
	
	if(hours[0] == "0")
		hours = hours[1];
		
	if(minutes[0] == "0")
		minutes = minutes[1];
		
	if(seconds[0] == "0")
		seconds = seconds[1];
	
	let res = (hours != "0" ? hours + "ч " : "" ) + 
			  (minutes != "0" ? minutes + "мин " : "" ) +
			  (seconds != "0" ? seconds + "сек" : "")
	
	if(res == "")
		res = "скоро..."
	
	return res;
}



module.exports = {print: timePrinter};