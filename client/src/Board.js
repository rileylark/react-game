import React, { Component } from 'react';

function adjustX(x) {
  return 150 + x * 3;
}

function adjustY(y) {
  return 300 - (150 + y * 3);
}

class Board extends Component {
  render() {
    if (!this.props.world) {
      return <div>loading</div>;
    } else {
      return (
        <svg height="300" width="300">
          
          <g transform={`translate(${adjustX(this.props.world.ball.x)} ${adjustY(this.props.world.ball.y)}) rotate(${-this.props.world.ball.angle / Math.PI * 180})`}>
            <circle cx="0" cy="0" r="10" stroke="black" strokeWidth="3" fill="red" />
            <line x1="0" y1="0" x2="0" y2="-20" stroke="black" />
          </g>
          
        </svg>
      );
    }

  }
}

export default Board;
