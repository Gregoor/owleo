export default {
  'users': {
    'login': 'POST',
    'logout': 'POST',
    'register': 'POST',
    'current': 'GET',
    'exists': 'GET'
  },
  'concepts': {
    'GET': 'all',
    'POST': 'create',
    'position': {'POST': 'reposition'},
    ':id': {
      'GET': 'find',
      'POST': 'update',
      'DELETE': 'delete',
      '#links': {
        'POST': 'create',
        ':linkId': {
          'votes': {
            'POST': 'vote',
            'DELETE': 'unvote'
          }
        }
      }
    }
  },
  'search': {'GET': 'go'}
};
