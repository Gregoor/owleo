import React, {Component} from 'react';
import Relay from 'react-relay';
import {Spring} from 'react-motion';

import {TextField} from '../mdl';

import './select.scss';

const ITEM_HEIGHT = 50;

class ConceptSelect extends Component {

  state = {
    focused: 0, listWidth: 0, listHeight: 0,
    showList: true, itemsVisible: false,
    concepts: []
  };

  concepts = [];
  selected = [];

  componentWillReceiveProps({viewer: {concepts}}) {
    if (this.state.itemsVisible && !concepts.length) {
      this.setState({itemsVisible: false});
    }
  }

  componentDidUpdate() {
    let {width, height} = this.refs.list.getBoundingClientRect();
    if (this.state.listWidth != width || this.state.listHeight != height) {
      this.setState({listWidth: width, listHeight: height});
    }

    if (this.props.relay.variables.query && !this.state.itemsVisible) {
      this.setState({itemsVisible: true});
    }

    window.componentHandler.upgradeElements(this.refs.list);
  }

  render() {
    let {id, label, multi, viewer} = this.props;
    let {concepts} = viewer;
    let {query} = this.props.relay.variables;
    let {focused, listWidth, listHeight, itemsVisible, showList} = this.state;

    let selectedItems = multi ? this.selected.map((concept, i) => (
      <div key={concept.id} className="chip">
        {concept.name}
        <i className="material-icons" onClick={this._onUnselect.bind(this, i)}>
          close
        </i>
      </div>
    )) : '';

    let items;
    if (concepts.length) {
      items = concepts.map((concept, i) => (
        <li key={concept.id} className={focused == i ? 'is-focused' : ''}
            style={{opacity: itemsVisible ? 1 : 0, transitionDelay:
                          `${i / ITEM_HEIGHT * concepts.length * .01}s`}}
            onMouseMove={this._onMouseMove.bind(this, i)}
            onClick={this._onSelect.bind(this, concept)}>
          {concept.name}
        </li>
      ));
    } else {
      items = <li><em>No concepts found</em></li>;
    }

    return (
      <div onKeyDown={this._onKeyDown.bind(this)}
           onBlur={this._onBlur.bind(this)} onFocus={this._onFocus.bind(this)}>
        <div className="mdl-textfield mdl-js-textfield
                    mdl-textfield--floating-label">
          {selectedItems}
          <input className="mdl-textfield__input" type="text" ref="input"
                 onChange={this._onChange.bind(this)} {...{id}}/>
          <label className={`mdl-textfield__label
                          ${multi && selectedItems.length ? 'has-values' : ''}`}
                 htmlFor={id}>
            {label}
          </label>
        </div>
        <div className={`material-select
                        ${query && showList ? 'is-visible' : ''}`}>
          <div className="outline"
               style={{width: listWidth, height: listHeight}}/>
          <ul style={{clip: `rect(0px, ${listWidth}px, ${listHeight}px, 0px)`}}
              ref="list">
            {items}
          </ul>
        </div>
      </div>
    );
  }

  getSelected() {
    return this.props.multi ? this.selected : this.selected[0];
  }

  _onChange(event) {
    let {value: query} = event.target;
    if (query.length < 3) return;
    if (!this.props.multi) this.selected = [];
    if (!query) this.setState({itemsVisible: false});
    this.setState({showList: true, focused: 0});
    this.props.relay.setVariables({query});
  }

  _onKeyDown(event) {
    let {concepts} = this.props.viewer;
    let {length} = concepts;
    let {focused} = this.state;
    switch (event.keyCode) {
      case 38/*UP*/:
        focused = focused - 1;
        if (focused < 0) focused = length - 1;
        break;
      case 40/*DOWN*/:
        focused = (focused + 1) % length;
        break;
      case 13/*ENTER*/:
        this._onSelect(concepts[focused]);
        event.preventDefault();
        return;
      case 27/*ESC*/:
        this.setState({showList: false});
        return;
      default:
        return;
    }
    event.preventDefault();
    this.setState({focused});
  }

  _onMouseMove(i) {
    if (this.state.focused != i) {
      this.setState({focused: i});
    }
  }

  _onFocus() {
    this.setState({showList: true});
  }

  _onBlur() {
    setTimeout(() => this.setState({showList: false}), 100);
  }

  _onSelect(concept) {
    this.selected.push(concept);
    if (this.props.multi) {
      this.props.relay.setVariables({exclude: this.selected.map(c => c.id)});
    }
    this.refs.input.value = this.props.multi ? '' : concept.name;
    this.setState({showList: false});
  }

  _onUnselect(i) {
    this.selected.splice(i, 1);
    this.props.relay.setVariables({exclude: this.selected.map(c => c.id)});
  }

}

ConceptSelect.defaultProps = {multi: false};

export default Relay.createContainer(ConceptSelect, {

  initialVariables: {query: null, exclude: []},

  fragments: {
    viewer: () =>  Relay.QL`
      fragment on Viewer {
        concepts(query: $query, limit: 5, exclude: $exclude) {
          id,
          name,
          container {
            name
          }
        }
      }
    `
  }

});
