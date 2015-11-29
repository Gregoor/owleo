import React, {Component} from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';
import classNames from 'classnames';
import _ from 'lodash';

import ConceptList from './list';
import pathToUrl from '../../path-to-url';

const buttonSize = '26px';
const buttonStyle = {
  marginLeft: '-36px', marginRight: '10px',
  height: buttonSize, width: buttonSize, minWidth: buttonSize,
  fontSize: '14px', fontWeight: '600'
};

class ConceptListItem extends Component {

  componentWillMount() {
    let {expanded} = this.props;
    if (expanded !== undefined) this.setExpanded(expanded);
  }

  componentWillReceiveProps(props) {
    let {expanded, concept, selectedId, selectedPath} = props;
    if (expanded !== undefined && this.props.expanded !== expanded) {
      this.setExpanded(expanded);
    }

    if (!this.isSelected) {
      if (concept.id == selectedId || _.isArray(selectedPath) && _.isEmpty(selectedPath)) {
        this.isSelected = true;
        this.refs.label.scrollIntoView({behavior: 'smooth'});
      } else this.isSelected = false;
    }
  }

  componentDidUpdate() {
    window.componentHandler.upgradeDom();
  }

  render() {
    let {concept, selectedPath, selectedId, onSelect} = this.props;

    let sublist = '';
    if (this.props.relay.variables.includeSublist) {
      sublist = <ConceptList {...this.props} concept={concept} isRoot={false}/>;
    }

    let {id, name, conceptsCount} = concept;
    let isSelected = selectedPath || selectedId == id;

    let headStyle = {
      display: 'inline-block',
      width: '100%',
      color: 'black',
      textDecoration: 'none',
      fontWeight: isSelected ? 600: 'normal'
    };

    return (
      <li style={{listStyleType: 'none', marginLeft: '10px'}}>
        <div style={{padding: '10px 0'}} ref="label">
          <button onClick={this.onClickButton.bind(this)}
                  className={classNames('mdl-button mdl-js-button ' +
                    'mdl-button--raised mdl-button--icon',
                    {'mdl-button--colored': isSelected})}
                  style={buttonStyle}>
            {conceptsCount || ' '}
          </button>
          <Link to={pathToUrl(concept.path)} onClick={this.onSelect.bind(this)}
                style={headStyle}>
            {name}
          </Link>
        </div>
        {sublist}
      </li>
    );
  }

  onClickButton() {
    this.setExpanded(!this.props.relay.variables.includeSublist);
  }

  onSelect() {
    this.isSelected = true;
    this.props.onSelect(this.props.concept);
  }

  setExpanded(state) {
    this.props.relay.setVariables({includeSublist: state});
  }

}

export default Relay.createContainer(ConceptListItem, {

  initialVariables: {
    includeSublist: false
  },

  fragments: {
    concept: (variables) =>  Relay.QL`
      fragment on Concept {
        id,
        name,
        path {
          name
        },
        conceptsCount,
        ${ConceptList.getFragment('concept').if(variables.includeSublist)}
      }
    `
  }

});
