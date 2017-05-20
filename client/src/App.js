import React, { Component } from 'react';
import DebugOutput from './DebugOutput';
import Board from './Board';

import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Board world={this.props.wholeState.world} />

        <DebugOutput completeState={this.props.wholeState} />
      </div>
    );
  }
}

export default App;
