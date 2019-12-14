function objectsSummator(objA, objB) {
	let keysB = Object.keys(objB);
	for(let i = 0; i < keysB.length; i++) {
		let el = objB[keysB[i]];
		if(objA[keysB[i]] != null) {
			if(typeof el == "number") {
				objA[keysB[i]] += el;
			} else if(typeof el == "object") {
				objectsSummator(objA[keysB[i]], el);
			}
		} else {
			objA[keysB[i]] = el;
		}
	}
}

module.exports = objectsSummator;