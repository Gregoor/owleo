export default (url) => {
  const parser = document.createElement('a');
  parser.href = url;
  const path = parser.pathname.split('/');

  let i = 1, part;
  do {
    part = path[path.length - i];
    i++;
  } while (part.length == 0 && i > path.length);
  return `${parser.protocol}//${parser.hostname}/../${part}${parser.hash}`;
}
