import React from 'react';
import _ from 'lodash';
import DocumentTitle from 'react-document-title';

let sections = new Map([
  ['Motivation', (
    <span>
      Owleo is an explorable graph for concepts, it shows how concepts are
      related, allows you to find ideal learning paths
      and contains links to learning resources from around the web. Think of
      it as a more pragmatic, but more structured Wikipedia with aspects of
      StackOverflow/Reddit.<br/>
      After logging in you are free to contibute to the graph by adding new
      explanations or voting on existing ones. Currently creating new concepts
      or modifying existing ones is not available for new users, since the
      editor is not yet in a good state. It will be rolled out later.
    </span>
  )],
  ['Contact', (
    <span>
      You can reach me on <a href="https://twitter.com/not_clegane">Twitter</a>
      &nbsp;or <a href="https://github.com/Gregoor/">GitHub</a>.
    </span>
  )],
  ['Technology', (
    <span>
      Owleo relies almost exclusively on open source software and the vast
      majority of our stack is implemented in Javasript. <br/>
      The frontend is built with Facebook's <a href="http://facebook.github.io/react/">React</a>&nbsp;
      and the map visualization with&nbsp;
      <a href="https://carrotsearch.com/foamtree-overview/">Foamtree</a>, UI
      elements are mostly built with the help of&nbsp;
      <a href="getmdl.io/">Material Design lite</a>.
      <br/>
      Wherever feasible ES6+ features are used thanks to <a
      href="https://babeljs.io/">babel.js</a>. <br/>
      The database is <a href="http://neo4j.com/">Neo4j</a> (a graph database)
      and the backend is running <a href="https://nodejs.org/">node</a> with <a
      href="http://expressjs.com/">express</a> on the Backend. <br/>
      The frontend communicates with the backend through&nbsp;
      <a href="https://facebook.github.io/graphql/">GraphQL</a> with the help
      of and <a href="https://facebook.github.io/relay/">Relay</a>. <br/>
      The application is hosted on <a href="https://www.digitalocean.com/">Digital
      Ocean</a>.
    </span>
  )]
]);

let sectionsHTML = [];
for (let [headline, text] of sections) {
  sectionsHTML.push(
    <div key={headline}
         className="mdl-cell mdl-cell--12-col mdl-card mdl-shadow--2dp">
      <div className="mdl-card__supporting-text">
        <h4 style={{marginTop: 0, color: 'rgb(97, 97, 97)'}}>{headline}</h4>
        <span>{text}</span>
      </div>
    </div>
  );
}

export default () => (
  <DocumentTitle title="About">
    <div className="mdl-demo mdl-grid" style={{maxWidth: 700}}>
      {sectionsHTML}
    </div>
  </DocumentTitle>
);
