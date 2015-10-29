export default {
  pathToUrl: (path) => {
    let parts = path.map(concept => encodeURIComponent(concept.name));
    return `/concepts/${parts.reverse().join('/')}`;
  }
};
