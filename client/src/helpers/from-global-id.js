const fromGlobalID = (id) => atob(id).split(':')[1];

export default fromGlobalID;
