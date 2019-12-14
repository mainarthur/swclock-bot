require("dotenv").config();

const db = require("./helpers/db.js");
const Bull = require("bull");

const factoryStartQueue = new Bull("factory-start");
const factoryEndQueue = new Bull("factory-end");
const loterryStartQueue = new Bull("lottery-start");
const lotteryEndQueue = new Bull("lottery-end");

const prodavanQueue = new Bull("prodavan");

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
		
	let match = parsers.prodavan(text);
	
	if(match != null) {
		
		if(udata.timers.prodavan.status) {
			await bot.sendMessage(uid, await db.strings.get("already_in_work"));
			return;
		}
		
		msg.forward_date *= 1000;
		
		let timeToWait = parsers.prodavanTime(text);
		
		if(timeToWait != null && (msg.forward_date + timeToWait) < Date.now()) {
			await bot.sendMessage(uid, await db.strings.get("forward_is_too_old"));
			return;
		} 
		
		let timeToDelay = msg.forward_date - Date.now() + timeToWait;
		log(timeToDelay)
		let hash = messageHash(msg);
		if(udata.statistics.prodavans.processed.indexOf(hash) != -1) {
			await bot.sendMessage(uid, await db.strings.get("already_parsed"));
			return;
		}
		
		udata.hero = match.hero;
		objectsSummator(udata.statistics.prodavans, match.statistics);
		udata.statistics.prodavans.processed.push(hash);
		
		let job = await prodavanQueue.add(udata, {
			delay: timeToDelay
		});
		
		udata.timers.prodavan.status = true;
		udata.timers.prodavan.jobId = job.id;
		
		await bot.sendMessage(uid, await db.strings.get("prodavan_accepted"));
		await db.users.set(udata);
		log(udata);
		return;
	}
	
	match = parsers.metro(text);
	
	if(match != null) {
		
		await db.users.set(udata);
		return;
	}
}


prodavanQueue.process( async (job) => {
	let {data: udata} = job;
	
	udata.timers.prodavan.status = false;
	udata.timers.prodavan.jobId = 0;
	
	await bot.sendMessage(udata.uid, await db.strings.get("prodavan_is_ready"));
	await db.users.set(udata);
});