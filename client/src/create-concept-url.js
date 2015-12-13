export default ({path, id}) => {
  let parts = path.map(({name}) => name.split(' ').join('-'));
  return `/concepts/${parts.reverse().join('/')}?id=${atob(id).split(':')[1]}`;
};
