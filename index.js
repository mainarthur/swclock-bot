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


