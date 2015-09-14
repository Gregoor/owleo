export default {
  pathToUrl: (path) => `#/${path.map(c => encodeURI(c)).reverse().join('/')}/`
};
