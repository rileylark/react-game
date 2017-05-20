import React from 'react';

export default function Board({world}) {
  if (!world) {
    return <div>loading</div>;
  } else {
    return (
      <svg style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0 }} height="100%" width="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <g transform="translate(50, 50) scale(1, -1)">
          <g transform={`translate(${world.ball.x} ${world.ball.y}) rotate(${world.ball.angle / Math.PI * 180})`}>
            <Ship />
          </g>
        </g>
      </svg>
    );
  }
}

function Ship() {
  return (
    <g>
      <circle cx="0" cy="0" r="5" stroke="black" strokeWidth="0.5" fill="yellow" />
      <line x1="0" y1="0" x2="0" y2="10" stroke="black" />
    </g>
  );
}
