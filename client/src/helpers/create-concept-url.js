import fromGlobalID from './from-global-id';

export default ({id, path}, options) => {
  options = Object.assign({root: 'concepts', query: null}, options);
  const {root, query} = options;

  let parts = path.map(({name}) => name.split(' ').join('-'));
  const pathname =  `/${root}/${parts.reverse().join('/')}`;

  const queryParts = ['id=' + fromGlobalID(id)];
  if (query) for (const key of Object.keys(query)) {
    queryParts.push(`${key}=${query[key]}`);
  }

  return `${pathname}?${queryParts.join('&')}`;
};


