export default {
	'users': {
		'login': 'POST',
        'register': 'POST',
        'current': 'POST'
	},
	'concepts': {
		'GET': 'all',
		'POST': 'create',
		'position': {'POST': 'reposition'},
		':id': {
			'GET': 'find',
			'POST': 'update',
			'DELETE': 'delete'
		}
	},
	'search': {'GET': 'go'}
};