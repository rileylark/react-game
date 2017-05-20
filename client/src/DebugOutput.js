import React, { Component } from 'react';

class DebugOutput extends Component {
  render() {
    return (
      <div>
        <h2>Debug output</h2>
        <pre>
        {JSON.stringify(this.props.completeState, null, 4)}
        </pre>
      </div>
    );
  }
}

export default DebugOutput;
