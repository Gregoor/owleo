export default {
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