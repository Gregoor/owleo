export default {
  pathToUrl: (path) => {
    return `#/${path.map(c => encodeURIComponent(c)).reverse().join('/')}/`;
  }
};
