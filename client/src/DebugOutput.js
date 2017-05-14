import React, { Component } from 'react';

class DebugOutput extends Component {
  render() {
    return (
      <div>
        <h2>DEBUGGER OUTPUT</h2>
        <pre>
        {JSON.stringify(this.props.completeState)}
        </pre>
      </div>
    );
  }
}

export default DebugOutput;
