

module.exports = function(db) {
	return {
		_db: db,
		// return true, if hash already in db
		// false if hash is new for group
		check: async function(group, hash) {
			try {
				let h = await this._db.findOne({ "group": group, "hash": hash });
				if(h == null) {
					await this._db.insert({ "group": group, "hash": hash });
					return false;
				}
				return true;
			} catch(e) {
				console.log(e);
				return null;
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