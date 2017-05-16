import React, { Component } from 'react';

class Board extends Component {
  render() {
    if (!this.props.world) {
      return <div>loading</div>;
    } else {
      return (
        <svg height="300" width="300">
          <circle cx={this.props.world.ball.x * 10} cy={300 - this.props.world.ball.y * 10} r="10" stroke="black" strokeWidth="3" fill="red" />
        </svg>
      );
    }

  }
}

export default Board;
