import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

const TRANSITION_DURATION = 700;
const CardAnimation = ({delay = 0, children}) => {
  let duration = TRANSITION_DURATION + delay;
  return (
    <ReactCSSTransitionGroup transitionName="card"
                             transitionEnterTimeout={duration}
                             transitionLeaveTimeout={duration}
                             transitionAppear={true}
                             transitionAppearTimeout={duration}>
      {children}
    </ReactCSSTransitionGroup>
  );
};

export default CardAnimation;
