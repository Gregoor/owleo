import React, {Component} from 'react';
import Relay from 'react-relay';

let style = {
  width: '100%',
  height: '18px',
  margin: '5px',
  padding: '10px 5px'
};

class SearchInput extends Component {

  render() {
    return (
      <input type="text" ref="input" placeholder="Search" style={style}
             onChange={this.onChange.bind(this)}
             onKeyUp={this.onKeyUp.bind(this)}/>
    );
  }

  onChange(event) {
    this.props.onChangeValue(event.target.value);
  }

  onKeyUp(event) {
    if (event.keyCode == 27/*ESC*/) {
      this.props.onChangeValue(this.refs.input.value = '');
    }
  }

}

export default SearchInput;
