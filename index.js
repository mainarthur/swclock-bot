require("dotenv").config();

const db = require("./helpers/db.js");
const Bull = require("bull");

const mainQueue = new Bull("swclock");

const bot = require("./helpers/bot.js");
const log = require("./helpers/log.js");

log("Bot started at " + new Date().toString());


const parsers = require("./helpers/parsers.js");
const objectsSummator = require("./helpers/objectsSummator.js");
const messageHash = require("./helpers/messageHash.js");

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
		
		await bot.sendMessage(uid, await db.strings.get("start_text"));
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
	
} 

async function checkMessage(msg, udata) {
	
	if(msg.forward_from == null || msg.forward_date == null)
		return;
		
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
		
		log("#New_Prodavan_from #id" + uid);
		
		udata.hero = match.hero;
		objectsSummator(udata.statistics.prodavans, match.statistics);
		
		msg.forward_date *= 1000;
		
		let timeToWait = parsers.prodavanTime(text);
		
		if(timeToWait != null && (msg.forward_date + timeToWait) > Date.now()) {
			
			if(!udata.timers.prodavan.status) {
				let timeToDelay = msg.forward_date - Date.now() + timeToWait;
				
				let job = await mainQueue.add({
					type: "prodavan",
					uid: uid
				}, {
					delay: timeToDelay
				});
		
				udata.timers.prodavan.status = true;
				udata.timers.prodavan.jobId = job.id;
			
			}
			
			if(match.statistics.boxes.standart != 0 || match.statistics.boxes.lamp != 0) {
				let boxTimeToWait = 24*60*60*1000;
				if(!udata.timers.box.status && (msg.forward_date + boxTimeToWait) > Date.now()) {
					let boxTimeToDelay = msg.forward_date - Date.now() + boxTimeToWait;
			
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
		msg.forward_date *= 1000;
		let timeToWait = 15*60*60*1000;
		if(timeToWait != null && (msg.forward_date + timeToWait) > Date.now()) {
			let timeToDelay = msg.forward_date - Date.now() + timeToWait;
			
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
		msg.forward_date *= 1000;
		let timeToWait = parsers.petTime(text);
		if(timeToWait != null) {
			if((msg.forward_date + timeToWait) > Date.now()) {
				if(udata.timers.dog.status) {
					await bot.sendMessage(uid, await db.strings.get("dog_timer_already_in"));
					return;
				}
				log("#New_dog_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait;
				
				let job = await mainQueue.add({
					type: "dog",
					uid: uid
				}, {
					delay: timeToDelay
				});
		
				udata.timers.dog.status = true;
				udata.timers.dog.jobId = job.id;
				
				await bot.sendMessage(uid, await db.strings.get("dog_report_accepted"));
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
		msg.forward_date *= 1000;
		let timeToWait = parsers.petTime(text);
		console.log(timeToWait);
		if(timeToWait != null) {
			if((msg.forward_date + timeToWait) > Date.now()) {
				if(udata.timers.mouse.status) {
					await bot.sendMessage(uid, await db.strings.get("mouse_timer_already_in"));
					return;
				}
				log("#New_mouse_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait;
				
				let job = await mainQueue.add({
					type: "mouse",
					uid: uid
				}, {
					delay: timeToDelay
				});
		
				udata.timers.mouse.status = true;
				udata.timers.mouse.jobId = job.id;
				
				await bot.sendMessage(uid, await db.strings.get("mouse_report_accepted"));
			} else {
				await bot.sendMessage(uid, await db.strings.get("old_mouse_message"));
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