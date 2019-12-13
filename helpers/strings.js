
String.prototype.replaceAll = function(s, t) {
	return this.split(s).join(t);
}


module.exports = function(db) {
	return {
		_db: db,
		
		set: async function(id, value) {
			try {
				var string = await this._db.findOne({ id: id });
				if(string != null) {
					string.value = value;
					await this._db.update({ id: id }, string);
				} else {
					await this._db.insert({
						id: id,
						value: value
					});
				}
				return true;
			} catch(e) {
				console.log(e);
				return false;
			}
		},
		
		get: async function(id) {
			try {
				var string = await this._db.findOne({ id: id });
				if(string != null)
					return string.value.replaceAll("\\n","\n");
				else 
					return id;
			} catch(e) {
				console.log(e);
				return null;
			}
		}
		, 
		
		count: async function() {
			return await this._db.count({});
		},
		
		all: async function() {
			return await this._db.find({});
		}
	}
}