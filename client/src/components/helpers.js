export default {
  shadowStyle: {
    boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)'
  },
  pathToUrl: (path) => {
    return `/concepts/${path.map(encodeURIComponent).reverse().join('/')}/`;
  }
};
