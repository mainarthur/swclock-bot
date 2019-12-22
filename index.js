require("dotenv").config();

const db = require("./helpers/db.js");
const Bull = require("bull");

const mainQueue = new Bull("swclock");

const bot = require("./helpers/bot.js");
const log = require("./helpers/log.js");

(async function() {
	await bot.startPolling();
	log("Bot started at " + new Date().toString());
})();

const parsers = require("./helpers/parsers.js");
const objectsSummator = require("./helpers/objectsSummator.js");
const messageHash = require("./helpers/messageHash.js");
const timePrinter = require("./helpers/timePrinter.js");

bot.on('message', async (msg) => {
	let { from: user, chat, text } = msg;
	
	text = text.replaceAll("\xa0", " ");
	msg.text = text;
	if(chat.type != "private") {
		await bot.leaveChat(chat.id);
		return;
	}
	
	let udata = await db.users.add(user);
	if(udata == null) {
		console.log("udata == null\nUser: " + user);
		return;
	}
	
	let match = parsers.command(msg);
	
	if(match != false) {
		await answerCommand(msg, udata, match);
	} else if(text != null) {
		await checkMessage(msg, udata);
	}
	
});

async function answerCommand(msg, udata, match) {
	let { uid } = udata;
	let { command, args } = match;
	
	
	if(command == "start") {
		if(!udata.started) {
			udata.started = true;
			await db.users.set(udata);
		}
		
		await bot.sendMessage(uid, await db.strings.get("start_text"), {
			parse_mode: "HTML",
			disable_web_page_preview: true
		});
	}
	
	if(command == "me") {
		let answer = await db.strings.get("me_label") + "\n\n";
		
		if(udata.hero.level > 0) {
			answer += await db.strings.get("your_hero_label") + "\n";
			let { corp, nickname, level, power } = udata.hero;
			
			answer += corp + nickname + " (" + level + ")\n";
			
			let { practice, theory, wisdom, cunning } = power;
			
			answer += "🔨" + practice + " 🎓" + theory + " 🐿" + cunning + " 🐢" + wisdom + "\n\n";
		} 
		
		let { prodavans, metro } = udata.statistics;
		
		answer += await db.strings.get("prodavans_label") + "\n";
		
		with(prodavans) { // 
			answer += "⚔" + victories + " 🤬" + defeats + "\n";
			answer += "💡" + experience + " 💵" + money + "\n";
			answer += "📚" + knowledge + " ⚙" + (details.standart + details.VIP) + "\n";
			answer += "🎁" + (boxes.standart + boxes.lamp) + " ⚪" + (upgrades.white + upgrades.whiteLamp) + "\n";
			answer += "🔵" + upgrades.blue + " 🔴" + upgrades.red + "\n";
		
		}
		answer += "/prodavans\n\n";
		
		answer += await db.strings.get("metro_label");
		
		with(metro) {
			answer += "🚇" + (atime + intime) + " (" + intime + "/" + atime + ") 🕳" + tokens + "\n";
			answer += "📚" + knowledge + " ⚙" + details + " 🔩" + bolts + "\n";
			answer += "🌭" + hotdogs + " 🍕" + pizzas + " 🍔" + burgers + "\n";
			answer += "⚪" + upgrades.white +  " 🔵" + upgrades.blue + " 🔴" + upgrades.red + "\n";
		}
		
		await bot.sendMessage(uid, answer);
	}
	
	if(command == "prodavans") {
		let answer = await db.strings.get("prodavans_label") + "\n\n";
		
		let { prodavans } = udata.statistics;
		with(prodavans) { // 
			answer += "⚔ Победы: " + victories + "\n";
			answer += "🤬 Поражения: " + defeats + "\n";
			
			answer += "💡 Опыт: " + experience + "\n";
			answer += "💵 Деньги: " + money + "\n";
			answer += "📚 Знания: " + knowledge + "\n";
			answer += "⚙Детали:\n├ Обычные: " + details.standart + "\n";
			answer += "└ За VIP: " + details.VIP + "\n";
			answer += "🎁 Коробки: \n├ Обычные: " + boxes.standart + "\n";
			answer += "└ За 🔦: " + boxes.lamp + "\n";
			answer += "Улучшения:\n├ ⚪: " + upgrades.white + "\n";
			answer += "├ ⚪🔦: " + upgrades.whiteLamp;
			answer += "\n├ 🔵: " + upgrades.blue + "\n└ 🔴: " + upgrades.red + "\n";
		
		}
		
		await bot.sendMessage(uid, answer);
	}
	
	if(command == "my_timers") {
		let timersKeys = Object.keys(udata.timers);
		
		timersKeys = timersKeys.filter(e => udata.timers[e].status);
		
		if(timersKeys.length == 0) {
			await bot.sendMessage(uid, await db.strings.get("you_dont_have_any"));
		} else {
			let answer = await db.strings.get("my_timers_label") + "\n";
			
			for(let i = 0; i < timersKeys.length; i++) {
				let t = udata.timers[timersKeys[i]];
				
				answer += await db.strings.get(timersKeys[i] + "_timer_label") + "\n";
				if(db.repeatableTimers.indexOf(timersKeys[i]) == -1) {
					// => Не повторяющийся таймер
					let j = await mainQueue.getJob(t.jobId);
					
					let timeToAlert = j.timestamp + j.delay - Date.now();
					
					answer += "├ через: " + timePrinter.print(timeToAlert) + "\n";
					answer += "└ /stop_" + timersKeys[i] + "\n\n";
					
				} else {
					// => Регулярнвй таймер
					
					
				}
			}
			await bot.sendMessage(uid, answer);
		}
	}
	
	if(command.indexOf("stop_") == 0 & command != "stop_") {
		let timerName = command.substr(5);
		
		if(udata.timers[timerName] != null) {
			let t = udata.timers[timerName];
			
			if(!t.status) {
				await bot.sendMessage(uid, await db.strings.get("timer_isnt_on"));
			} else {
				
				let job = await mainQueue.getJob(udata.timers[timerName].jobId);
				
				await job.remove();
				
				udata.timers[timerName].status = false;
				udata.timers[timerName].jobId = 0;
				
				await bot.sendMessage(uid, await db.strings.get("timer_stopped"));
				await db.users.set(udata);
			}
		}
	}
	
	if(uid != db.constants.adminId)
		return;
		
	if(command == "setstr") {
		let m = args.match(/([a-z_0-9]+)\s.+/i);
		if(m != null) {
			let key = m[1];
			let text = args.substr(key.length).trim();
			await db.strings.set(key, text);
			await bot.sendMessage(uid, "OK\n\n/getstr " + key);
		} else {
			await bot.sendMessage(uid, "Invalid syntax");
		}
	}

	if(command == "getstr") {
		let str = await db.strings.get(args);
		await bot.sendMessage(uid,"/sestr " + args + " " + str);
	}
	
	if(command == "u") {
		let u = await db.users.get(parseInt(args));
		log(u);
	}
	
	if(command == "job_debug") {
		let j = await mainQueue.getJob(args);
		log(j);
	}
	
} 

async function checkMessage(msg, udata) {
	
	if(msg.forward_from == null || msg.forward_date == null)
		return;
		
		
	// Перевод секунд в милисекунды
	msg.forward_date *= 1000;
	
	if(db.startupWarsIds.indexOf(msg.forward_from.id) == -1)
		return;
		
	
	let { uid } = udata;
	let { text } = msg;
	
	
	//
	// Проверка на продаванов
	//
	let match = parsers.prodavan(text);
	if(match != null) {
		
		let hash = messageHash(msg);
		if(await db.hashes.check("prodavan", hash)) {
			await bot.sendMessage(uid, await db.strings.get("already_parsed"));
			return;
		}
		
		log("#New_prodavan_from #id" + uid);
		
		udata.hero = match.hero;
		objectsSummator(udata.statistics.prodavans, match.statistics);
		
		
		
		let timeToWait = parsers.prodavanTime(text);
		
		if(timeToWait != null && (msg.forward_date + timeToWait) > Date.now()) {
			
			if(!udata.timers.prodavan.status) {
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;
				
				let job = await mainQueue.add({
					type: "prodavan",
					uid: uid
				}, {
					delay: timeToDelay
				});
		
				udata.timers.prodavan.status = true;
				udata.timers.prodavan.jobId = job.id;
			
			}
			
			if(match.statistics.boxes.standart == 1 || match.statistics.boxes.lamp == 1) {
				let boxTimeToWait = 24*60*60*1000;
				if(!udata.timers.box.status && (msg.forward_date + boxTimeToWait) > Date.now()) {
					let boxTimeToDelay = msg.forward_date - Date.now() + boxTimeToWait + 20000;
			
					let boxJob = await mainQueue.add({
						type: "box",
						uid: uid
					}, {
						delay: boxTimeToDelay
					});
					
					udata.timers.box.status = true;
					udata.timers.box.jobId = boxJob.id;
				}
			}
		
			await bot.sendMessage(uid, await db.strings.get("prodavan_accepted"));
		} else {
			await bot.sendMessage(uid, await db.strings.get("prodavan_was_added_to_db"));
		}
		
		await db.users.set(udata);
		return;
	}
	/****************************/
	
	//
	// Проверка на метро
	//
	match = parsers.metro(text);
	if(match != null) {
		let hash = messageHash(msg);
		if(await db.hashes.check("metro", hash)) {
			await bot.sendMessage(uid, await db.strings.get("already_parsed"));
			return;
		}
		log("#New_Metro_from #id" + uid);
		
		objectsSummator(udata.statistics.metro, match.statistics);
		
		let timeToWait = 15*60*60*1000;
		if(timeToWait != null && (msg.forward_date + timeToWait) > Date.now()) {
			let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;
			
			if(!udata.timers.metro.status) {
				let job = await mainQueue.add({
					type: "metro",
					uid: uid
				}, {
					delay: timeToDelay
				});
		
				udata.timers.metro.status = true;
				udata.timers.metro.jobId = job.id;
			}
			
			await bot.sendMessage(uid, await db.strings.get("metro_accepted"));
		} else {
			await bot.sendMessage(uid, await db.strings.get("metro_was_added_to_db"));
		}
		
		await db.users.set(udata);
		return;
	}
	/****************************/
	
	//
	// Проверка на собаку
	//
	if(parsers.isDog(text)) {
		let hash = messageHash(msg);
		if(await db.hashes.check("dog", hash)) {
			await bot.sendMessage(uid, await db.strings.get("already_parsed"));
			return;
		}
		
		
		let timeToWait = parsers.petTime(text);
		
		if(timeToWait != null) {
			if((msg.forward_date + timeToWait) > Date.now()) {
				if(udata.timers.dog.status) {
					await bot.sendMessage(uid, await db.strings.get("dog_timer_already_in"));
					return;
				}
				log("#New_dog_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;
				
				let job = await mainQueue.add({
					type: "dog",
					uid: uid
				}, {
					delay: timeToDelay
				});
		
				udata.timers.dog.status = true;
				udata.timers.dog.jobId = job.id;
				
				await bot.sendMessage(uid, await db.strings.get("dog_report_accepted"));
				await db.users.set(udata);
			} else {
				await bot.sendMessage(uid, await db.strings.get("old_dog_message"));
			}
		}
		
	}
	/****************************/
	
	//
	// Проверка на мышь
	//
	if(parsers.isMouse(text)) {
		let hash = messageHash(msg);
		if(await db.hashes.check("mouse", hash)) {
			await bot.sendMessage(uid, await db.strings.get("already_parsed"));
			return;
		}
		
		
		let timeToWait = parsers.petTime(text);
		
		if(timeToWait != null) {
			if((msg.forward_date + timeToWait) > Date.now()) {
				if(udata.timers.mouse.status) {
					await bot.sendMessage(uid, await db.strings.get("mouse_timer_already_in"));
					return;
				}
				log("#New_mouse_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;
				
				let job = await mainQueue.add({
					type: "mouse",
					uid: uid
				}, {
					delay: timeToDelay
				});
		
				udata.timers.mouse.status = true;
				udata.timers.mouse.jobId = job.id;
				
				await bot.sendMessage(uid, await db.strings.get("mouse_report_accepted"));
				await db.users.set(udata);
			} else {
				await bot.sendMessage(uid, await db.strings.get("old_mouse_message"));
			}
		}
	}
	/****************************/
	
	//
	// Проверка на говномобиль
	//
	if(parsers.isCar(text)) {
		let hash = messageHash(msg);
		if(await db.hashes.check("car", hash)) {
			await bot.sendMessage(uid, await db.strings.get("already_parsed"));
			return;
		}
		
		
		let timeToWait = parsers.vehicleTime(text);
		
		if(timeToWait != null) {
			if((msg.forward_date + timeToWait) > Date.now()) {
				if(udata.timers.car.status) {
					await bot.sendMessage(uid, await db.strings.get("car_timer_already_in"));
					return;
				}
				log("#New_car_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;
				
				let job = await mainQueue.add({
					type: "car",
					uid: uid
				}, {
					delay: timeToDelay
				});
		
				udata.timers.car.status = true;
				udata.timers.car.jobId = job.id;
				
				await bot.sendMessage(uid, await db.strings.get("car_report_accepted"));
				await db.users.set(udata);
			} else {
				await bot.sendMessage(uid, await db.strings.get("old_car_message"));
			}
		}
	}
	/****************************/
	
	//
	// Проверка на велик
	//
	if(parsers.isBicycle(text)) {
		let hash = messageHash(msg);
		if(await db.hashes.check("bicycle", hash)) {
			await bot.sendMessage(uid, await db.strings.get("already_parsed"));
			return;
		}
		
		
		let timeToWait = parsers.vehicleTime(text);
		
		if(timeToWait != null) {
			if((msg.forward_date + timeToWait) > Date.now()) {
				if(udata.timers.bicycle.status) {
					await bot.sendMessage(uid, await db.strings.get("bicycle_timer_already_in"));
					return;
				}
				log("#New_bicycle_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;
				
				let job = await mainQueue.add({
					type: "bicycle",
					uid: uid
				}, {
					delay: timeToDelay
				});
		
				udata.timers.bicycle.status = true;
				udata.timers.bicycle.jobId = job.id;
				
				await bot.sendMessage(uid, await db.strings.get("bicycle_report_accepted"));
				await db.users.set(udata);
			} else {
				await bot.sendMessage(uid, await db.strings.get("old_bicycle_message"));
			}
		}
	}
	/****************************/
	
	//
	// Проверка на трактор
	//
	if(parsers.isTrac(text)) {
		let hash = messageHash(msg);
		if(await db.hashes.check("trac", hash)) {
			await bot.sendMessage(uid, await db.strings.get("already_parsed"));
			return;
		}
		
		
		let timeToWait = parsers.vehicleTime(text);
		
		if(timeToWait != null) {
			if((msg.forward_date + timeToWait) > Date.now()) {
				if(udata.timers.trac.status) {
					await bot.sendMessage(uid, await db.strings.get("trac_timer_already_in"));
					return;
				}
				log("#New_trac_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;
				
				let job = await mainQueue.add({
					type: "trac",
					uid: uid
				}, {
					delay: timeToDelay
				});
		
				udata.timers.trac.status = true;
				udata.timers.trac.jobId = job.id;
				
				await bot.sendMessage(uid, await db.strings.get("trac_report_accepted"));
				await db.users.set(udata);
			} else {
				await bot.sendMessage(uid, await db.strings.get("old_trac_message"));
			}
		}
	}
	/****************************/
	
	//
	// Мандарины
	//
	
	if(msg.forward_from.id == db.constants.mandarinBotId || parsers.isMandarin(text)) {
		let timeToWait;
		
		if(msg.forward_from.id == db.constants.mandarinBotId)
			timeToWait = 20*60*60*1000;
		else
			timeToWait = parsers.mandarinTime(text);
		
		if(timeToWait != null) {
			if((msg.forward_date + timeToWait) > Date.now()) {
				if(udata.timers.mandarin.status) {
					let oldJob = await mainQueue.getJob(udata.timers.mandarin.jobId);
					await oldJob.remove();
				}
				log("#New_mandarin_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;
				
				let job = await mainQueue.add({
					type: "mandarin",
					uid: uid
				}, {
					delay: timeToDelay
				});
		
				udata.timers.mandarin.status = true;
				udata.timers.mandarin.jobId = job.id;
				
				await bot.sendMessage(uid, await db.strings.get("mandarin_report_accepted"));
				await db.users.set(udata);
			} else {
				await bot.sendMessage(uid, await db.strings.get("old_mandarin_message"));
			}
		}
	}
	
	/****************************/
}


mainQueue.process( async (job) => {
	let { data } = job;
	let { uid, type } = data;
	
	let udata = await db.users.get(uid);
	if(udata == null)
		return;
	if(udata.timers[type] == null)
		return;
	
	if(db.repeatableTimers.indexOf(type) == -1) {
		log("#New_" + type + "_for #id" + uid);
		
		udata.timers[type].status = false;
		udata.timers[type].jobId = 0;
	}
	
	await bot.sendMessage(uid, await db.strings.get(type + "_is_ready"));
	await db.users.set(udata);
});