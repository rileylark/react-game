import React from 'react';

export default function Board({ world }) {
  if (!world.players.ball) {
    return <div>loading</div>;
  } else {
    return (
      <svg style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0 }} height="100%" width="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <g transform="translate(50, 50) scale(1, -1)">

          {world.level.walls.map(drawWall)}
          {drawShip(world.players.ball)}
        </g>
      </svg>
    );
  }
}

function drawShip(ship) {
  return (
    <g transform={`translate(${ship.x} ${ship.y}) rotate(${ship.angle / Math.PI * 180})`}>
      <circle cx="0" cy="0" r="5" stroke="black" strokeWidth="0.5" fill="yellow" />
      <line x1="0" y1="0" x2="0" y2="10" stroke="black" />
    </g>
  );
}

function drawWall(wall, index) {
  const topLeft = {
    x: wall.x - wall.width / 2,
    y: wall.y - wall.height / 2
  }

  return <g transform={`translate(${topLeft.x} ${topLeft.y})`} key={index}>
    <rect width={wall.width} height={wall.height} />
  </g>;

}
