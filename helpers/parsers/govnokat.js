/*
🏳‍🌈Arthur Kh, [5/1/20, 2:39 PM]
[ Forwarded from Startup Wars ]
🛴Самокат заряжается ещё 2ч. 48 мин.
Приходи, когда будет полный заряд.

🏳‍🌈Arthur Kh, [5/1/20, 2:39 PM]
[ Forwarded from Startup Wars ]
Поехал кататься на 🛴Самокате. Перед поездкой починил это чудо китайской промышленности за 10🔩 и потратил на аккумуляторы 30 💵. Вернёшься через 10 минут.
Отменить: /decline.

🛴Говнокат

*/

module.exports = function govno(text) {
	if(text == null || typeof text != "string")
		return false;
		
		
	if(text.indexOf("Поехал кататься на 🛴Самокате") == 0) {
		return true;
	}
	
	
	if(text.indexOf("🛴Самокат заряжается ещё") == 0) {
		if(text.includes("Приходи, когда будет полный заряд."))
			return true;
	}
	
	return false;
}