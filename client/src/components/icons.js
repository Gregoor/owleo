import React from 'react';
import {Icon, Spinner} from 'react-mdl';

const Check = () => <Icon name="check_circle" className="color-text--valid"/>;
const Cross = () => <Icon name="cancel" className="color-text--invalid"/>;
const Mastered = ({style}) => (
  <Icon name="check" className="color-text--valid"
        title="You mastered this concept!"
        style={Object.assign({cursor: 'default'}, style)}/>
);
const CenteredSpinner = ({style = {}}) => (
  <div style={{display: 'flex', justifyContent: 'center',
                     overflow: 'hidden', ...style}}>
    <Spinner/>
  </div>
);

export {CenteredSpinner, Check, Cross, Mastered};
