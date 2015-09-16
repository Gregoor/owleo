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
      <input type="text" placeholder="Search" style={style} {...this.props}/>
    );
  }

}

export default SearchInput;
