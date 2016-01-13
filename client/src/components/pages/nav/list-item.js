import React from 'react';
import {Link} from 'react-router';
import Relay from 'react-relay';
import classNames from 'classnames';
import _ from 'lodash';
import {Button, Spinner} from 'react-mdl';

import createConceptURL from '../../../helpers/create-concept-url';
import ConceptList from './list';


const headStyle = {
  display: 'inline-block',
  width: '100%',
  color: 'black',
  textDecoration: 'none'
};

const buttonSize = '26px';
const buttonStyle = {
  marginLeft: '-36px', marginRight: '10px',
  height: buttonSize, width: buttonSize, minWidth: buttonSize,
  fontSize: '14px', fontWeight: '600'
};

class ConceptListItem extends React.Component {

  state = {isLoading: false};

  componentWillMount() {
    const {expanded} = this.props;
    if (expanded !== undefined) this._setExpanded(expanded);
  }

  componentWillReceiveProps(props) {
    const {expanded} = props;
    if (expanded !== undefined && this.props.expanded !== expanded) {
      this._setExpanded(expanded);
    }
  }

  render() {
    const {concept, level} = this.props;

    let sublist;
    if (this.state.isLoading) {
      sublist = <Spinner style={{left: 'initial', top: 'initial'}}/>;
    } else if (this.props.relay.variables.includeSublist) {
      sublist = <ConceptList {...this.props} concept={concept}
                             level={level + 1}/>;
    }

    const {name, mastered, conceptsCount} = concept;

    return (
      <li style={{listStyleType: 'none', marginLeft: '10px', fontSize: 17}}>
        <div style={{padding: '10px 0'}}
             ref="label">
          <Button colored={this._isInSelection()} style={buttonStyle} raised
                  className="mdl-button--icon"
                  onClick={this._handleButtonClick.bind(this)}>
            {conceptsCount || ' '}
          </Button>
          <Link to={createConceptURL(concept)}
                onClick={this._handleSelect.bind(this)}
                style={Object.assign({
                        fontWeight: this._isSelected() ? 600 : 'normal', opacity: mastered ? .4 : 1
                      }, headStyle)}>
            {name}
          </Link>
        </div>
        {sublist}
      </li>
    );
  }

  _isInSelection() {
    const {selectedPath, concept, level} = this.props;
    return !_.isEmpty(selectedPath) && concept.id == selectedPath[level];
  }

  _isSelected() {
    const {selectedPath, level} = this.props;
    return this._isInSelection() && level + 1 == selectedPath.length;
  }

  _handleButtonClick() {
    this._setExpanded(!this.props.relay.variables.includeSublist);
  }

  _handleSelect() {
    this.props.onSelect(this.props.concept);
    this._setExpanded(true);
  }

  _setExpanded(state) {
    if (this.props.concept.conceptsCount == 0) return;
    this.setState({isLoading: true});
    this.props.relay.setVariables({includeSublist: state}, readyState => {
      if (readyState.done) this.setState({isLoading: false});
    });
  }

}

ConceptListItem.defaultProps = {
  onSelect: _.noop
};

export default Relay.createContainer(ConceptListItem, {

  initialVariables: {
    includeSublist: false
  },

  fragments: {
    concept: (variables) =>  Relay.QL`
      fragment on Concept {
        id
        name
        path {
          name
        }
        mastered
        conceptsCount
        ${ConceptList.getFragment('concept').if(variables.includeSublist)}
      }
    `
  }

});
