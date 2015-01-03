var _ = require('lodash');
var Promise = require('promise');

var query = require('../db/connection.js').query;

module.exports = {
	'search': function(name) {
		return query(
			'MATCH (tag:Tag) WHERE tag.name =~ {name} ' +
			'RETURN tag.name AS name ' +
			'LIMIT 5',
			{'name': '.*' + name + '.*'}
		);
	}
};