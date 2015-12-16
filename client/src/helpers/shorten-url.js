export default (url) => {
  const parser = document.createElement('a');
  parser.href = url;
  let path = parser.pathname.split('/');

  let i = 1, part;
  do {
    part = path[path.length - i];
    i++;
  } while (part.length == 0 && i > path.length);
  return `${parser.hostname}/../${part}${parser.hash}`;
}
