import React from 'react';
import {Icon} from 'react-mdl';

const Check = () => <Icon name="check_circle" className="color-text--valid"/>;
const Cross = () => <Icon name="cancel" className="color-text--invalid"/>;
const Mastered = ({style}) => (
  <Icon name="check" className="color-text--valid"
        title="You mastered this concept!"
        style={Object.assign({cursor: 'default'}, style)}/>
);

export default {Check, Cross, Mastered};
