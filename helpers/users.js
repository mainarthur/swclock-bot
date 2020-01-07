const formatUdata = require("./formatUdata.js");
const userToString = require("./userToString.js");

const log = require("./log.js");

module.exports = function(db) {
	return {
		_db: db,
		
		add: async function(user) {
			try {
				let uid = user.id;
				let udata = await this.get(uid);
				formatUdata(user)
				if(udata != null) {
					let uinfo = udata.userinfo;
					
					if(uinfo.first_name != user.first_name ||
					   uinfo.last_name != user.last_name ||
					   uinfo.username != user.username ) {
			
						udata.userinfo = user;
						await this._db.update({ uid: uid }, udata);
						
					}
				} else {
					udata = {
						uid: uid,
						userinfo: user, // инфа по тг акку
						started: false,
						hero: { // инфа по герою в св
							nickname: "", // ник
							corp: "", // корпа
							level: 0, // лвл
							power: {
								practice: 0, // практика
								theory: 0, // теория
								wisdom: 0, // мудрость
								cunning: 0 // Хитрость
							}
						},
						statistics: { // статистика по отчетам
							prodavans: { // продаваны,
								experience: 0,
								victories: 0, // победы
								defeats: 0, // поражения
								money: 0, // бабло
								knowledge: 0, // знания
								details: { // детальки
									standart: 0,
									VIP: 0
								},
								boxes: { // коробочки
									standart: 0,
									lamp: 0
								},
								upgrades: { // заточки
									white: 0,
									blue: 0,
									red: 0,
									whiteLamp: 0
								}
							},
							metro: { // метро
								atime: 0, // досрочный выход
								intime: 0, // обычный выход
								knowledge: 0, // знания
								details: 0, // детальки
								bolts: 0, // болты
								burgers: 0, // бургеры
								pizzas: 0, // пиццы
								hotdogs: 0, // хотдоги
								tokens: 0, // токены
								upgrades: { // заточки
									white: 0,
									blue: 0,
									red: 0,
								},
								processed: []
							}
						},
						timers: {
							lotteryStart: {
								status: false,
								jobId: 0
							},
							lotteryEnd: {
								status: false,
								jobId: 0
							},
							factoryStart: {
								status: false,
								jobId: 0
							},
							factoryEnd: {
								status: false,
								jobId: 0
							},
							prodavan: {
								status: false,
								jobId: 0
							},
							box: {
								status: false,
								jobId: 0
							},
							mouse: {
								status: false,
								jobId: 0
							},
							dog: {
								status: false,
								jobId: 0
							},
							bicycle: {
								status: false,
								jobId: 0
							},
							car: {
								status: false,
								jobId: 0
							},
							rob: {
								status: false,
								jobId: 0
							},
							trac: {
								status: false,
								jobId: 0
							},
							mandarin: {
								status: false,
								jobId: 0
							},
							metro: {
								status: false,
								jobId: 0
							},
							book: {
								status: false,
								jobId: 0
							},
							battle: {
								status: false,
								jobsId: []
							}
						}
					};
					
					log(userToString(udata.userinfo) + "[#id" + uid + "][" + ((await this._db.count({})) + 1) + "] added to db at " + new Date().toString())
					await this._db.insert(udata);
				}
				return udata;
			} catch(e) {
				console.log(e);
				return null;
			}
		},
		
		set: async function(udata) {
			try {
				let uid = udata.uid;
				await this._db.update({ uid: uid }, udata, { upsert : true});
				return true;
			} catch(e) {
				console.log(e);
				return false;
			}
		},
		
		get: async function(id) {
			try {
				var udata = await this._db.findOne({ uid: id });
				if(udata != null)
					return udata
				else 
					return null;
			} catch(e) {
				console.log(e);
				return null;
			}
		},
		
		forEach: async function(f) {
			if(f == null)
				return;
			var all_users = await this._db.find({});
			for(let i = 0; i < all_users.length; i++) {
				if(f.constructor.name == "Function")
					f(all_users[i]);
				else if(f.constructor.name == "AsyncFunction")
					await f(all_users[i]);
			}
		}, 
		
		count: async function() {
			return await this._db.count({});
		},
		
		all: async function() {
			return await this._db.find({});
		}
	}
}
