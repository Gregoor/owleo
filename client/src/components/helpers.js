export default {
  pathToUrl: (path) => {
    return `#/concepts/${path.map(encodeURIComponent).reverse().join('/')}/`;
  }
};
