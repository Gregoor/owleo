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
    'nested': {'GET': 'allNested'},
    'POST': 'create',
    'position': {'POST': 'reposition'},
    ':id': {
      'GET': 'find',
      'POST': 'update',
      'DELETE': 'delete',
      '#explanations': {
        'POST': 'create',
        ':explanationId': {
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
