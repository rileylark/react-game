import React, { Component } from 'react';

class DebugOutput extends Component {
  render() {
    return (
      <div>
        <h2>Debug output</h2>
        <code>
        {JSON.stringify(this.props.completeState)}
        </code>
      </div>
    );
  }
}

export default DebugOutput;
