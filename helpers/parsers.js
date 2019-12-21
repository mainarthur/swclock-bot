module.exports = { 
	// Телега
	command: require("./parsers/isCommandMsg.js"),
	
	// Метро
	metro: require("./parsers/metro.js"),
	
	// Пидрованы
	prodavan: require("./parsers/prodavan.js"),
	prodavanTime: require("./parsers/prodavanTime.js"),
	
	// Петы
	isMouse: require("./parsers/mouse.js"),
	isDog: require("./parsers/dog.js"),
	petTime: require("./parsers/petTime.js"),
	
	// Транспорт
	isCar: require("./parsers/car.js"),
	isBicycle: require("./parsers/bicycle.js"),
	isTrac: require("./parsers/trac.js"),
	vehicleTime: require("./parsers/vehicleTime.js")
}