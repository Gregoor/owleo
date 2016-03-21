import React, {PropTypes} from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';

import fromGlobalID from '../../../helpers/from-global-id';
import {Mastered} from '../../icons';
import {PRIMARY} from '../../../colors';

import './mdl-list.scss';

class ConceptSimpleListItem extends React.Component {

  static propTypes = {
    concept: PropTypes.object.isRequired,
    selectedID: PropTypes.string
  };

  render() {
    const {concept, selectedID} = this.props;
    const {id, name, conceptsCount, mastered} = concept;
    const isSelected = selectedID == fromGlobalID(id);
    return (
      <li className="mdl-list__item">
        <span className="mdl-list__item-primary-content">
          <Link to="/concepts" query={{id: fromGlobalID(id)}}
                onClick={this._maybeDontShowSpinner.bind(this, conceptsCount)}
                style={{ textDecoration: 'none', color: 'black'}}>
            <span style={{display: 'inline-block', width: 26, height: 26,
                          textAlign: 'center', verticalAlign: 'middle',
                          borderStyle: 'solid', borderWidth: 2,
                          borderColor: isSelected ? PRIMARY : 'rgba(0, 0, 0, .2)',
                          marginRight: 10, borderRadius: 100}}>
              <span style={{display: 'inline-block', marginTop: 6, fontSize: 14,
                            fontWeight: 600}}>
                {conceptsCount || ''}
              </span>
            </span>
            <span ref="name" style={{fontSize: 17,
                                     fontWeight: isSelected ? 600 : 'normal'}}>
              {name}
            </span>
          </Link>
        </span>
        <span className="mdl-list__item-secondary-action">
          {mastered ? <Mastered/> : ''}
        </span>
      </li>
    );
  }

  _maybeDontShowSpinner(conceptsCount) {
    this.setState({showSpinner: conceptsCount > 0});
  }

}


export default Relay.createContainer(ConceptSimpleListItem, {

  initialVariables: {id: null},

  fragments: {
    concept: () =>  Relay.QL`
      fragment on Concept {
        id
        name
        mastered
        conceptsCount
      }
    `
  }

});
