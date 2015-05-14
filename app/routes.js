export default {
	'users': {
		'login': {'POST': 'login'},
        'register': {'POST': 'register'},
        'current': {'GET': 'current'}
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