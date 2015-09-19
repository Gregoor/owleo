import React, {Component} from 'react';

import {shadowStyle} from './helpers';

let headerStyle = Object.assign({
  height: '64px',
  backgroundColor: 'rgb(63,81,181)'
}, shadowStyle);

export default (props) => (
  <div>
    <div className="row" style={headerStyle}>
      <div className="col-xs-1">Owleo</div>
      <div className="col-xs-3 end-xs">Login</div>
    </div>
    {props.children}
  </div>
);
