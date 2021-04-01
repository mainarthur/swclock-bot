require("dotenv").config();

const db = require("./helpers/db.js");
const Bull = require("bull");
const userToString = require("./helpers/userToString.js");

const mainQueue = new Bull("swclock");
const botQueue = new Bull("swclock-bot-messages", {
	limiter: {
		max: 30,
		duration: 1000
	}
});

const bot = require("./helpers/bot.js");
const log = require("./helpers/log.js");

(async function () {
	await db.users.forEach(async (udata) => {
		if (udata.timers.labStart == null) {
			udata.timers.labStart = {
				status: false,
				jobId: 0
			}
			udata.timers.labEnd = {
				status: false,
				jobId: 0
			}

			await db.users.set(udata);
		}

		if (udata.statistics.prodavans.items == null) {
			udata.statistics.prodavans.items = {
				'screen': 0,
				'circuit': 0,
				'blade': 0,
				'rings': 0
			}

			await db.users.set(udata);
		}
	});
	await bot.startPolling();
	log("Bot started at " + new Date().toString());

})();

const parsers = require("./helpers/parsers.js");
const objectsSummator = require("./helpers/objectsSummator.js");
const messageHash = require("./helpers/messageHash.js");
const timePrinter = require("./helpers/timePrinter.js");

var antiflood = {};

bot.on('message', async (msg) => {
	let { from: user } = msg;
	let uid = user.id;

	if (uid == 162071853) {
		return;
	}

	if (antiflood[uid] == null) {
		antiflood[uid] = {};
	}

	let now = Math.floor(Date.now() / 1000);
	if (antiflood[uid][now] == null) {
		antiflood[uid][now] = 1;
	} else {
		antiflood[uid][now]++;
	}

	if (antiflood[uid][now] > 3)
		return;
	botQueue.add(msg, { removeOnComplete: true, removeOnFail: true });

});

// @ts-ignore
async function answerCommand(msg, udata, match) {
	let { uid } = udata;
	let { command, args } = match;


	if (command == "start") {
		if (!udata.started) {
			udata.started = true;
			await db.users.set(udata);
		}

		await bot.sendMessage(uid, await db.strings.get("start_text"), {
			parse_mode: "HTML",
			disable_web_page_preview: true,
			reply_markup: {
				resize_keyboard: true,
				keyboard: [
					[{ text: await db.strings.get("me") }, { text: await db.strings.get("prodavans") }],
					[{ text: await db.strings.get("my_timers") }, { text: await db.strings.get("factory") }],
				]
			}
		});
	}

	if (command == "me") {
		let answer = await db.strings.get("me_label") + "\n\n";

		if (udata.hero.level > 0) {
			answer += await db.strings.get("your_hero_label") + "\n";
			let { corp, nickname, level, power } = udata.hero;
			if (uid == 933445616) {
				nickname = "Умелый QA";
				corp = "❤";
			}
			if (level > 58) {
				log(`${corp}${nickname}(${level}) #id${uid}`)
			}
			answer += corp + nickname + " (" + level + ")\n";

			let { practice, theory, wisdom, cunning } = power;

			answer += "🔨" + practice + " 🎓" + theory + " 🐿" + cunning + " 🐢" + wisdom + "\n\n";
		}

		let { prodavans, metro, suicides } = udata.statistics;
		if (suicides > 0) {
			answer += "Вы сдохли: " + suicides + "раз\n\n";
		}
		answer += await db.strings.get("prodavans_label") + "\n";

		// @ts-ignore
		with (prodavans) { // 
			answer += "⚔" + victories + " 🤬" + defeats + "\n";
			answer += "💡" + experience + " 💵" + money + "\n";
			answer += "📚" + knowledge + " ⚙" + (details.standart + details.VIP) + "\n";
			answer += "🎁" + (boxes.standart + boxes.lamp) + " ⚪" + (upgrades.white + upgrades.whiteLamp) + "\n";
			answer += "🔵" + upgrades.blue + " 🔴" + upgrades.red + "\n";
			answer += "✂️Колечки: " + items.rings + " ";
			answer += "✂️Лезвия: " + items.blade + "\n";
			answer += "📟Экраны: " + items.screen + " ";
			answer += "📟Платы: " + items.circuit + "\n";
		}
		answer += "/prodavans\n\n";

		answer += await db.strings.get("metro_label");

		// @ts-ignore
		with (metro) {
			answer += "🚇" + (atime + intime) + " (" + intime + "/" + atime + ") \n🕳" + tokens + " 💵" + money + "\n";
			answer += "📚" + knowledge + " ⚙" + details + " 🔩" + bolts + "\n";
			answer += "🌭" + hotdogs + " 🍕" + pizzas + " 🍔" + burgers + "\n";
			answer += "⚪" + upgrades.white + " 🔵" + upgrades.blue + " 🔴" + upgrades.red + "\n";
		}

		await bot.sendMessage(uid, answer);
	}

	if (command == "prodavans") {
		let answer = await db.strings.get("prodavans_label") + "\n\n";

		let { prodavans } = udata.statistics;
		// @ts-ignore
		with (prodavans) { // 
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
			answer += "✂️Ножницы:\n";
			answer += "├Колечки: " + items.rings + "\n";
			answer += "└Лезвия: " + items.blade + "\n";
			answer += "📟Декодер:\n"
			answer += "├Экраны: " + items.screen + "\n";
			answer += "└Платы: " + items.circuit + "\n";



		}

		await bot.sendMessage(uid, answer);
	}


	if (command == "lab") {
		let answer = await db.strings.get("lab_text");

		let statusEmoji = "⛔";
		if (udata.timers.labStart.status) {
			statusEmoji = "✅";
		}

		answer = answer.replace("{0}", statusEmoji);

		await bot.sendMessage(uid, answer);
	}

	if (command == "lab_on") {
		if (!udata.timers.labStart.status) {
			// Запустить таймер
			let startJob = await mainQueue.add({
				uid: uid,
				type: "labStart"
			}, {
				repeat: {
					cron: "30 23 * * *"
				},
				jobId: 'labStart' + uid
			});

			let endJob = await mainQueue.add({
				uid: uid,
				type: "labEnd"
			}, {
				repeat: {
					cron: "5 0 * * *"
				},
				jobId: 'labEnd' + uid
			});

			log("#lab_on #id" + uid);

			udata.timers.labStart.status = true;
			udata.timers.labStart.jobId = startJob.id;

			udata.timers.labEnd.status = true;
			udata.timers.labEnd.jobId = endJob.id;

			await db.users.set(udata);
			await bot.sendMessage(uid, await db.strings.get("lab_enabled"));
		} else {
			// Таймер уже запущен
			await bot.sendMessage(uid, await db.strings.get("lab_timer_already_in"));
		}
	}

	if (command == "lab_off") {
		if (udata.timers.labStart.status) {
			// Выключить таймер
			let startJob = await mainQueue.getJob(udata.timers.labStart.jobId);
			if (startJob != null)
				await mainQueue.removeRepeatable(startJob.opts.repeat)

			let endJob = await mainQueue.getJob(udata.timers.labEnd.jobId);
			if (endJob != null)
				await mainQueue.removeRepeatable(endJob.opts.repeat)

			udata.timers.labStart.status = false;
			udata.timers.labStart.jobId = 0;

			udata.timers.labEnd.status = false;
			udata.timers.labEnd.jobId = 0;

			log("#lab_off #id" + uid);

			await db.users.set(udata);
			await bot.sendMessage(uid, await db.strings.get("lab_disabled"));
		} else {
			// Таймер уже выключен
			await bot.sendMessage(uid, await db.strings.get("lab_timer_already_stopped"));
		}
	}

	if (command == "factory") {
		let answer = await db.strings.get("factory_text");

		let statusEmoji = "⛔";
		if (udata.timers.factoryStart.status) {
			statusEmoji = "✅";
		}

		answer = answer.replace("{0}", statusEmoji);

		await bot.sendMessage(uid, answer);
	}

	if (command == "factory_on") {
		if (!udata.timers.factoryStart.status) {
			// Запустить таймер
			let startJob = await mainQueue.add({
				uid: uid,
				type: "factoryStart"
			}, {
				repeat: {
					cron: "00 18 * * *"
				},
				jobId: 'factoryStart' + uid
			});

			let endJob = await mainQueue.add({
				uid: uid,
				type: "factoryEnd"
			}, {
				repeat: {
					cron: "30 18 * * *"
				},
				jobId: 'factoryEnd' + uid
			});

			log("#factory_on #id" + uid);

			udata.timers.factoryStart.status = true;
			udata.timers.factoryStart.jobId = startJob.id;

			udata.timers.factoryEnd.status = true;
			udata.timers.factoryEnd.jobId = endJob.id;

			await db.users.set(udata);
			await bot.sendMessage(uid, await db.strings.get("factory_enabled"));
		} else {
			// Таймер уже запущен
			await bot.sendMessage(uid, await db.strings.get("factory_timer_already_in"));
		}
	}

	if (command == "factory_off") {
		if (udata.timers.factoryStart.status) {
			// Выключить таймер
			let startJob = await mainQueue.getJob(udata.timers.factoryStart.jobId);
			if (startJob != null)
				await mainQueue.removeRepeatable(startJob.opts.repeat)

			let endJob = await mainQueue.getJob(udata.timers.factoryEnd.jobId);
			if (endJob != null)
				await mainQueue.removeRepeatable(endJob.opts.repeat)

			udata.timers.factoryStart.status = false;
			udata.timers.factoryStart.jobId = 0;

			udata.timers.factoryEnd.status = false;
			udata.timers.factoryEnd.jobId = 0;

			log("#factory_off #id" + uid);

			await db.users.set(udata);
			await bot.sendMessage(uid, await db.strings.get("factory_disabled"));
		} else {
			// Таймер уже выключен
			await bot.sendMessage(uid, await db.strings.get("factory_timer_already_stopped"));
		}
	}

	if (command == "suicide") {
		await bot.sendMessage(uid, await db.strings.get("you_died"));
		udata.statistics.suicides++;
		if (udata.statistics.suicides == 1)
			log("User #id" + uid + " #died");
		await db.users.set(udata);
	}

	if (command == "graveyard") {
		let all = await db.users.all();
		all = all.filter(udata => udata.statistics.suicides > 0)
		all.sort((a, b) => b.statistics.suicides - a.statistics.suicides);

		let yourPos = all.map(udata => udata.uid).indexOf(uid);
		all = all.slice(0, 15);
		let answer = await db.strings.get("graveyard_title") + "\n";

		for (let i = 0; i < all.length; i++) {
			let u = all[i];
			let ui = u.userinfo;
			let s = u.statistics.suicides;
			if (u.uid == uid) {
				answer += `#${i + 1} <b>${ui.first_name + (ui.last_name == null ? "" : " " + ui.last_name)}</b>: ${s}\n`
			} else {
				answer += `#${i + 1} ${userToString(ui)}: ${s}\n`
			}
		}
		if (yourPos == -1) {
			answer += await db.strings.get("not_dead")
		} else if (yourPos > all.length) {
			answer += "...\n";
			let ui = udata.userinfo;
			let s = udata.statistics.suicides;
			answer += `#${yourPos + 1} <b>${ui.first_name + (ui.last_name == null ? "" : " " + ui.last_name)}</b>: ${s}\n`
		} else if (yourPos == all.length) {
			let ui = udata.userinfo;
			let s = udata.statistics.suicides;
			answer += `#${yourPos + 1} <b>${ui.first_name + (ui.last_name == null ? "" : " " + ui.last_name)}</b>: ${s}\n`
		}
		// @ts-ignore
		await bot.sendMessage(uid, answer, { parse_mode: "html" });
	}

	if (command == "my_timers") {
		let timersKeys = Object.keys(udata.timers);

		timersKeys = timersKeys.filter(e => udata.timers[e].status);

		timersKeys = timersKeys.filter(e => db.repeatableTimers.indexOf(e) == -1);

		if (timersKeys.length == 0) {
			await bot.sendMessage(uid, await db.strings.get("you_dont_have_any"));
		} else {
			let answer = await db.strings.get("my_timers_label") + "\n";

			for (let i = 0; i < timersKeys.length; i++) {
				if (db.repeatableTimers.indexOf(timersKeys[i]) == -1) {
					let t = udata.timers[timersKeys[i]];



					let j = await mainQueue.getJob(t.jobId);
					if (j == null) {
						udata.timers[timersKeys[i]].status = false;
						udata.timers[timersKeys[i]].jobId = 0;

						await db.users.set(udata);
						continue;
					}
					answer += await db.strings.get(timersKeys[i] + "_timer_label") + "\n";
					// @ts-ignore
					let timeToAlert = j.timestamp + j.delay - Date.now();

					answer += "├ через: " + timePrinter.print(timeToAlert) + "\n";
					answer += "└ /stop_" + timersKeys[i] + "\n\n";

				}
			}
			await bot.sendMessage(uid, answer);
		}
	}

	// @ts-ignore
	if (command.indexOf("stop_") == 0 & command != "stop_") {
		let timerName = command.substr(5);

		if (udata.timers[timerName] != null && db.repeatableTimers.indexOf(timerName) == -1) {
			let t = udata.timers[timerName];

			if (!t.status) {
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

	if (command == "custom") {
		if (args == null || args == "") {
			await bot.sendMessage(uid, await db.strings.get("custom_help"));
			return
		}

		if (udata.timers.custom.status) {
			await bot.sendMessage(uid, await db.strings.get("custom_timer_already_started"));
			return;
		}


		let customRegExp = /(\d+ч\s)?(\d+м\s)?.+/i
		let time = 0;
		let text = "";
		let offset = 0;

		let match = args.match(customRegExp);

		for (let i = 1; i < match.length; i++) {
			let m = match[i];
			if (m != null) {
				if (m.includes("м")) {
					time += parseInt(m) * 60 * 1000;
					offset += m.length;
				} else {
					time += parseInt(m) * 60 * 60 * 1000;
					offset += m.length;
				}
			}
		}

		text = args.substr(offset);

		console.log(`Custom timer args="${args}" match=[${match.join(",")}] time=${time} offset=${offset} text="${text}"`);

		if (time == 0 || text == "" || time > 24 * 60 * 60 * 1000) {
			await bot.sendMessage(uid, await db.strings.get("invalid_args"));
			return;
		}


		let job = await mainQueue.add("custom", {
			uid: uid,
			text: text
		}, {
			delay: time,
			removeOnComplete: true
		});

		udata.timers.custom.status = true;
		udata.timers.custom.jobId = job.id;

		await db.users.set(udata);
		await bot.sendMessage(uid, await db.strings.get("custom_timer_started"));

	}

	if (uid != db.constants.adminId)
		return;

	if (command == "stop_timers") {
		let u = await db.users.get(parseInt(args));

		if (u == null) {
			await bot.sendMessage(uid, "User not found");
			return;
		}
		let timersKeys = Object.keys(u.timers);

		timersKeys = timersKeys.filter(e => u.timers[e].status);

		if (timersKeys.length == 0) {
			await bot.sendMessage(uid, "no timers");
		} else {
			for (let i = 0; i < timersKeys.length; i++) {
				if (db.repeatableTimers.indexOf(timersKeys[i]) == -1) {


					try {
						u.timers[timersKeys[i]].status = false;

						let j = await mainQueue.getJob(u.timers[timersKeys[i]].jobId);
						u.timers[timersKeys[i]].jobId = 0;

						await j.remove();
					} catch (e) {
						console.log(e);
					}

				}
			}
			await db.users.set(u);
			await bot.sendMessage(uid, "done");
		}
	}

	if (command == "setstr") {
		let m = args.match(/([a-z_0-9]+)\s.+/i);
		if (m != null) {
			let key = m[1];
			let text = args.substr(key.length).trim();
			await db.strings.set(key, text);
			await bot.sendMessage(uid, "OK\n\n/getstr " + key);
		} else {
			await bot.sendMessage(uid, "Invalid syntax");
		}
	}


	if (command == "getstr") {
		let str = await db.strings.get(args);
		await bot.sendMessage(uid, "/setstr " + args + " " + str);
	}

	if (command == "magic") {
		let t = await db.users.get(488681934)

		console.log(t);
		t.statistics.suicides = 9999;
		await db.users.set(t)
		console.log(t);
	}

	if (command == "u") {
		let u = await db.users.get(parseInt(args));
		log(u);
	}

	if (command == "job_debug") {
		let j = await mainQueue.getJob(args);
		log(j);
	}

}

async function checkMessage(msg, udata) {

	let { text } = msg;

	switch (text) {
		case await db.strings.get("me"):
			await answerCommand(msg, udata, {
				command: "me",
				args: ""
			});
			return;
		case await db.strings.get("my_timers"):
			await answerCommand(msg, udata, {
				command: "my_timers",
				args: ""
			});
			return;
		case await db.strings.get("prodavans"):
			await answerCommand(msg, udata, {
				command: "prodavans",
				args: ""
			});
			return;
		case await db.strings.get("factory"):
			await answerCommand(msg, udata, {
				command: "factory",
				args: ""
			});
			return;
	}

	if (msg.forward_from == null || msg.forward_date == null)
		return;


	// Перевод секунд в милисекунды
	msg.forward_date *= 1000;

	if (db.startupWarsIds.indexOf(msg.forward_from.id) == -1)
		return;


	let { uid } = udata;



	//
	// Проверка на продаванов
	//
	let match = parsers.prodavan(text);
	if (match != null) {

		let hash = messageHash(msg);
		if (!(await db.hashes.check("prodavan", hash))) {
			log("#New_prodavan_from #id" + uid);

			udata.hero = match.hero;
			objectsSummator(udata.statistics.prodavans, match.statistics);
		}

		if (udata.hero.level > 58) {
			log(`${udata.hero.corp}${udata.hero.nickname}(${udata.hero.level}) #id${uid} #kaluga`)
		}

		let timeToWait = parsers.prodavanTime(text);


		if (timeToWait != null && (msg.forward_date + timeToWait) > Date.now()) {


			let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;
			console.log(`[prodavan] timeToWait=${timeToWait} timeToDelay=${timeToDelay}`)
			if (udata.timers.prodavan.status) {
				let oldJob = await mainQueue.getJob(udata.timers.prodavan.jobId);
				await oldJob.remove();
			}

			let job = await mainQueue.add({
				type: "prodavan",
				uid: uid
			}, {
				delay: timeToDelay,
				removeOnComplete: true
			});

			udata.timers.prodavan.status = true;
			udata.timers.prodavan.jobId = job.id;


			if (match.statistics.boxes.standart == 1 || match.statistics.boxes.lamp == 1) {
				let boxTimeToWait = 24 * 60 * 60 * 1000;
				if (!udata.timers.box.status && (msg.forward_date + boxTimeToWait) > Date.now()) {
					let boxTimeToDelay = msg.forward_date - Date.now() + boxTimeToWait + 20000;

					let boxJob = await mainQueue.add({
						type: "box",
						uid: uid
					}, {
						delay: boxTimeToDelay,
						removeOnComplete: true
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
	// @ts-ignore
	match = parsers.metro(text);
	if (match != null) {
		let hash = messageHash(msg);
		if (!(await db.hashes.check("metro", hash))) {
			log("#New_Metro_from #id" + uid);

			objectsSummator(udata.statistics.metro, match.statistics);
		}


		let timeToWait = 16 * 60 * 60 * 1000;
		if (timeToWait != null && (msg.forward_date + timeToWait) > Date.now()) {
			let timeToDelay = timeToWait + 20000;

			if (udata.timers.metro.status) {
				let oldJob = await mainQueue.getJob(udata.timers.metro.jobId);
				await oldJob.remove();
			}

			let job = await mainQueue.add({
				type: "metro",
				uid: uid
			}, {
				delay: timeToDelay,
				removeOnComplete: true
			});

			udata.timers.metro.status = true;
			udata.timers.metro.jobId = job.id;


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
	if (parsers.isDog(text)) {

		let timeToWait = parsers.petTime(text);

		if (timeToWait != null) {
			if ((msg.forward_date + timeToWait) > Date.now()) {
				if (udata.timers.dog.status) {
					let oldJob = await mainQueue.getJob(udata.timers.dog.jobId);
					await oldJob.remove();
				}
				log("#New_dog_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;

				let job = await mainQueue.add({
					type: "dog",
					uid: uid
				}, {
					delay: timeToDelay,
					removeOnComplete: true
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
	if (parsers.isMouse(text)) {

		let timeToWait = parsers.petTime(text);

		if (timeToWait != null) {
			if ((msg.forward_date + timeToWait) > Date.now()) {
				if (udata.timers.mouse.status) {
					let oldJob = await mainQueue.getJob(udata.timers.mouse.jobId);
					await oldJob.remove();
				}
				log("#New_mouse_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;

				let job = await mainQueue.add({
					type: "mouse",
					uid: uid
				}, {
					delay: timeToDelay,
					removeOnComplete: true
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
	// Проверка на изменение пета
	//
	if (parsers.isPetChange(text)) {

		let timeToWait = parsers.petTime(text);

		if (timeToWait != null) {
			if ((msg.forward_date + timeToWait) > Date.now()) {
				if (udata.timers.petChange.status) {
					let oldJob = await mainQueue.getJob(udata.timers.petChange.jobId);
					await oldJob.remove();
				}
				log("#New_petChange_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;

				let job = await mainQueue.add({
					type: "petChange",
					uid: uid
				}, {
					delay: timeToDelay,
					removeOnComplete: true
				});

				udata.timers.petChange.status = true;
				udata.timers.petChange.jobId = job.id;

				await bot.sendMessage(uid, await db.strings.get("petChange_report_accepted"));
				await db.users.set(udata);
			} else {
				await bot.sendMessage(uid, await db.strings.get("old_petChange_message"));
			}
		}
	}


	/****************************/

	//
	// Проверка на говномобиль
	//
	if (parsers.isCar(text)) {

		/*
		let hash = messageHash(msg);
		if(await db.hashes.check("car", hash)) {
			await bot.sendMessage(uid, await db.strings.get("already_parsed"));
			return;
		}
		*/

		let timeToWait = parsers.vehicleTime(text);

		if (timeToWait != null) {
			if ((msg.forward_date + timeToWait) > Date.now()) {
				if (udata.timers.car.status) {
					let oldJob = await mainQueue.getJob(udata.timers.car.jobId);
					await oldJob.remove();
				}
				log("#New_car_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;

				let job = await mainQueue.add({
					type: "car",
					uid: uid
				}, {
					delay: timeToDelay,
					removeOnComplete: true
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
	if (parsers.isBicycle(text)) {

		/*
		let hash = messageHash(msg);
		if(await db.hashes.check("bicycle", hash)) {
			await bot.sendMessage(uid, await db.strings.get("already_parsed"));
			return;
		}
		*/

		let timeToWait = parsers.vehicleTime(text);

		if (timeToWait != null) {
			if ((msg.forward_date + timeToWait) > Date.now()) {
				if (udata.timers.bicycle.status) {
					let oldJob = await mainQueue.getJob(udata.timers.bicycle.jobId);
					await oldJob.remove();
				}
				log("#New_bicycle_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;

				let job = await mainQueue.add({
					type: "bicycle",
					uid: uid
				}, {
					delay: timeToDelay,
					removeOnComplete: true
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
	if (parsers.isTrac(text)) {


		/*
		let hash = messageHash(msg);
		if(await db.hashes.check("trac", hash)) {
			await bot.sendMessage(uid, await db.strings.get("already_parsed"));
			return;
		}
		*/


		let timeToWait = parsers.vehicleTime(text);

		if (timeToWait != null) {
			if ((msg.forward_date + timeToWait) > Date.now()) {
				if (udata.timers.trac.status) {
					let oldJob = await mainQueue.getJob(udata.timers.trac.jobId);
					await oldJob.remove();
				}
				log("#New_trac_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;

				let job = await mainQueue.add({
					type: "trac",
					uid: uid
				}, {
					delay: timeToDelay,
					removeOnComplete: true
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

	//
	// Проверка на трамвай
	//
	if (parsers.isTram(text)) {


		/*
		let hash = messageHash(msg);
		if(await db.hashes.check("trac", hash)) {
			await bot.sendMessage(uid, await db.strings.get("already_parsed"));
			return;
		}
		*/


		let timeToWait = parsers.vehicleTime(text);

		if (timeToWait != null) {
			if ((msg.forward_date + timeToWait) > Date.now()) {
				if (udata.timers.tram.status) {
					let oldJob = await mainQueue.getJob(udata.timers.tram.jobId);
					await oldJob.remove();
				}
				log("#New_tram_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;

				let job = await mainQueue.add({
					type: "tram",
					uid: uid
				}, {
					delay: timeToDelay,
					removeOnComplete: true
				});

				udata.timers.tram.status = true;
				udata.timers.tram.jobId = job.id;

				await bot.sendMessage(uid, await db.strings.get("tram_report_accepted"));
				await db.users.set(udata);
			} else {
				await bot.sendMessage(uid, await db.strings.get("old_tram_message"));
			}
		}
	}
	/****************************/

	//
	// Мандарины
	//

	if (msg.forward_from.id == db.constants.mandarinBotId || parsers.isMandarin(text)) {
		let timeToWait;

		if (msg.forward_from.id == db.constants.mandarinBotId)
			timeToWait = 20 * 60 * 60 * 1000;
		else
			timeToWait = parsers.mandarinTime(text);

		if (timeToWait != null) {
			if ((msg.forward_date + timeToWait) > Date.now()) {
				if (udata.timers.mandarin.status) {
					let oldJob = await mainQueue.getJob(udata.timers.mandarin.jobId);
					await oldJob.remove();
				}
				log("#New_mandarin_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;

				let job = await mainQueue.add({
					type: "mandarin",
					uid: uid
				}, {
					delay: timeToDelay,
					removeOnComplete: true
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


	// 
	// Проверка на коробочку
	// 
	if (parsers.isBox(text)) {
		let boxTimeToWait = parsers.boxTime(text);
		if (udata.timers.box.status) {
			let oldJob = await mainQueue.getJob(udata.timers.box.jobId);
			await oldJob.remove();
		}
		if (boxTimeToWait != null && (msg.forward_date + boxTimeToWait) > Date.now()) {
			let boxTimeToDelay = msg.forward_date - Date.now() + boxTimeToWait + 20000;

			log("#new_box_from #id" + uid);
			let boxJob = await mainQueue.add({
				type: "box",
				uid: uid
			}, {
				delay: boxTimeToDelay,
				removeOnComplete: true
			});

			udata.timers.box.status = true;
			udata.timers.box.jobId = boxJob.id;
			await db.users.set(udata);
			await bot.sendMessage(uid, await db.strings.get("box_report_accepted"));
		} else {
			await bot.sendMessage(uid, await db.strings.get("old_box_message"));
		}
	}

	if (parsers.isGorbushkaBox(text)) {
		let boxTimeToWait = 24 * 60 * 60 * 1000;
		if (udata.timers.box.status) {
			let oldJob = await mainQueue.getJob(udata.timers.box.jobId);
			await oldJob.remove();
		}
		if (boxTimeToWait != null && (msg.forward_date + boxTimeToWait) > Date.now()) {
			let boxTimeToDelay = msg.forward_date - Date.now() + boxTimeToWait + 20000;

			log("#new_box_from #id" + uid);
			let boxJob = await mainQueue.add({
				type: "box",
				uid: uid
			}, {
				delay: boxTimeToDelay,
				removeOnComplete: true
			});

			udata.timers.box.status = true;
			udata.timers.box.jobId = boxJob.id;
			await db.users.set(udata);
			await bot.sendMessage(uid, await db.strings.get("box_report_accepted"));
		} else {
			await bot.sendMessage(uid, await db.strings.get("old_box_message"));
		}
	}
	/****************************/

	//
	// Проверка на книжку с опытом
	//
	if (parsers.isBook(text)) {

		/*
		let hash = messageHash(msg);
		if(await db.hashes.check("book", hash)) {
			await bot.sendMessage(uid, await db.strings.get("already_parsed"));
			return;
		}
		*/

		if (udata.timers.book.status) {
			let oldJob = await mainQueue.getJob(udata.timers.book.jobId);
			await oldJob.remove();
		}


		let bookTimeToWait = 50 * 60 * 1000;

		if ((msg.forward_date + bookTimeToWait) > Date.now()) {
			let timeToDelay = msg.forward_date - Date.now() + bookTimeToWait + 20000;

			log("#New_book_from #id" + uid);
			let job = await mainQueue.add({
				type: "book",
				uid: uid
			}, {
				delay: timeToDelay,
				removeOnComplete: true
			});

			udata.timers.book.status = true;
			udata.timers.book.jobId = job.id;
			await db.users.set(udata);
			await bot.sendMessage(uid, await db.strings.get("book_report_accepted"));
		} else {
			await bot.sendMessage(uid, await db.strings.get("old_book_message"));
		}
	}
	/****************************/

	//
	// ебаный говнокат
	// 
	if (parsers.isGovnokat(text)) {
		let timeToWait = parsers.vehicleTime(text);

		if (timeToWait != null) {
			if ((msg.forward_date + timeToWait) > Date.now()) {
				if (udata.timers.govnokat.status) {
					let oldJob = await mainQueue.getJob(udata.timers.govnokat.jobId);
					await oldJob.remove();
				}
				log("#New_govnokat_from #id" + uid);
				let timeToDelay = msg.forward_date - Date.now() + timeToWait + 20000;

				let job = await mainQueue.add({
					type: "govnokat",
					uid: uid
				}, {
					delay: timeToDelay,
					removeOnComplete: true
				});

				udata.timers.govnokat.status = true;
				udata.timers.govnokat.jobId = job.id;

				await bot.sendMessage(uid, await db.strings.get("govnokat_report_accepted"));
				await db.users.set(udata);
			} else {
				await bot.sendMessage(uid, await db.strings.get("old_trac_message"));
			}
		}
	}
	/****************************/


}


mainQueue.process(async (job) => {
	let { data } = job;
	let { uid, type } = data;

	let udata = await db.users.get(uid);
	if (udata == null)
		return;
	if (udata.timers[type] == null)
		return;

	if (db.repeatableTimers.indexOf(type) == -1) {
		log("#New_" + type + "_for #id" + uid);

		udata.timers[type].status = false;
		udata.timers[type].jobId = 0;
		await db.users.set(udata);
	}
	await bot.sendMessage(uid, await db.strings.get(type + "_is_ready"));
});

mainQueue.process("custom", async (job) => {
	let { data } = job;
	let { uid, text } = data;
	let type = "custom";
	let udata = await db.users.get(uid);

	if (udata == null)
		return;
	if (udata.timers[type] == null)
		return;

	log("#New_" + type + "_for #id" + uid);

	udata.timers[type].status = false;
	udata.timers[type].jobId = 0;

	await bot.sendMessage(uid, text);
	await db.users.set(udata);
});

botQueue.process(async (job) => {
	let msg = job.data;

	let { from: user, chat, text } = msg;

	text = text.replaceAll("\xa0", " ");
	msg.text = text;
	if (chat.type != "private") {
		await bot.leaveChat(chat.id);
		return;
	}

	let udata = await db.users.add(user);
	if (udata == null) {
		console.log("udata == null\nUser: " + user);
		return;
	}

	let match = parsers.command(msg);

	try {

		if (match != false) {
			await answerCommand(msg, udata, match);
		} else if (text != null) {
			await checkMessage(msg, udata);
		}

	} catch (e) {
		console.log(e)
	}

});
