import React from 'react';
import _ from 'lodash';

let sections = new Map([
  ['Motivation', (
    <span>
      Owleo is an explorable graph for IT skills, it shows how concepts are
        related, allows you to find ideal learning paths
        and contains links to learning resources from around the web. Think of
        it as a Google Maps for skills.<br/>
        After logging in you are free to contibute to the graph by writing
        explanations to for concepts, create new concept-nodes or by making
        improvements
        to the existing structure <br/>
        The longer term plan for owleo is to offer adaptive assessments for the
        concepts that are covered. By using the insight about a domains
        internal structure we seek to provide the learner with the highest
        possible learning rate.
    </span>
  )],
  ['Team', (
    <span>
      Owleo is being developed by <a href="https://twitter.com/brewergorge">Gregor
      Weber</a> and <a href="https://twitter.com/mxschumacher">Max
      Schumacher</a>.<br/>
      Gregor is responsible for the architecture and technical implementation
      and the deployment of the app. <br/>
      Max is responsible for the business side and education technoloy aspects
      of the app. <br/>
      We both share equally in product decisions. <br/>
    </span>
  )],
  ['Technology', (
    <span>
      Owleo relies almost exclusively on open source software and the vast
      majority of our stack is implemented in Javasript. <br/>
      We use Facebook's <a href="http://facebook.github.io/react/">React</a>
      and visualize the graph with <a href="http://d3js.org/">d3</a>, UI
      elements are mostly built with <a href="http://material-ui.com/">material-ui</a>.
      <br/>
      Wherever feasible ES6+ features are used thanks to <a
      href="https://babeljs.io/">babel.js</a>. <br/>
      Our database is <a href="http://neo4j.com/">Neo4j</a> (a graph database)
      we are running <a href="https://nodejs.org/">node</a> with <a
      href="http://expressjs.com/">express</a> on the Backend. <br/>
      The application is hosted on <a href="https://www.digitalocean.com/">Digital
      Ocean</a>.
    </span>
  )],
  ['Tools', (
    <span>
      Aside from the techologies used to built our application itself, a
        collection of tools help us in making progress. <br/>
        Our code is hosted on <a href="https://github.com/">Github</a>, client
        and backend are stored in seperate repositories.
        Ticketing for all aspects of the project is done in <a
      href="https://trello.com/">Trello</a>. Ideally tickets are very
        concrete, have a deadline and are assigned to a specic person. <br/>
        The vast majority of internal communication is done via <a
      href="https://slack.com/">Slack</a>, different topics can be discussed
        in the corresponding channels,
        thereby providing a clear separation of concerns. <br/>
        Also, Slack provides numerous possibilities to integreate with our other
        tools, for example activity on Trello and Github is posted into the
        right channels.<br/>
        Strategic and less concrete matters are documented in <a
      href="https://workflowy.com/">Workflowy</a>, a minimalst tool that
        supports natural thinking processes quite qell.
        For written documents, presentations and spreadsheets we use <a
      href="https://www.google.com/drive/">Google Drive</a> as part of the
        Apps for business package (including emails via <a
      href="inbox.google.com">Inbox</a>). <br/>
        Development itself happens mostly within Jetbrain's <a
      href="https://www.jetbrains.com/webstorm/">Webstorm</a> editor.
    </span>
  )]
]);

let sectionsHTML = [];
for (let [headline, text] of sections) {
  sectionsHTML.push(
    <div key={headline}
         className="mdl-cell mdl-cell--12-col mdl-card mdl-shadow--2dp">
      <div className="mdl-card__supporting-text">
        <h4 style={{color: 'rgb(97, 97, 97)'}}>{headline}</h4>
        {text}
      </div>
    </div>
  );
}

export default () => (
  <div className="mdl-demo mdl-grid" style={{maxWidth: 700}}>
    {sectionsHTML}
  </div>
);
