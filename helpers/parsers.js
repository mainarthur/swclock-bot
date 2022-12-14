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
	isPetChange: require("./parsers/pet_change"),
	
	// Транспорт
	isCar: require("./parsers/car.js"),
	isBicycle: require("./parsers/bicycle.js"),
	isTrac: require("./parsers/trac.js"),
    isTram: require("./parsers/tram.js"),
	isGovnokat: require("./parsers/govnokat.js"),
	vehicleTime: require("./parsers/vehicleTime.js"),
	
	// Мандарины
	
	isMandarin: require("./parsers/mandarin.js"),
	mandarinTime: require("./parsers/mandarinTime.js"),
	
	// Коробочка
	isBox: require("./parsers/box.js"),
	isGorbushkaBox: require("./parsers/gorbushkaBox"),
	boxTime: require("./parsers/boxTime.js"),
	
	// Книжки
	
	isBook: require("./parsers/book.js")
}
