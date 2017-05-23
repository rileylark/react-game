import React from 'react';

const teamFills = {
  red: 'red',
  blue: 'lightblue',
}

function drawWorld(world) {
  return [
    world.level.walls.map(drawWall),
    world.level.goals.map(drawGoal),
    world.players.map(drawShip),
    world.balls.map(drawBall),
  ];
}

export default function Board({ world, camera }) {
  if (!world.players || !world.balls) {
    return <div>{JSON.stringify(world.players)}</div>;
  } else {
    const xOffset = 50 - camera.x;
    const yOffset = 50 + camera.y;

    const drawnWorld = drawWorld(world);
    return (
      <svg style={{ position: 'fixed', top: 0, bottom: 0, left: 0, right: 0 }} height="100%" width="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <g transform={`translate(${xOffset} ${yOffset}) scale(1, -1)`}>
          {drawnWorld}
        </g>
        <g transform={`translate(90, 20) scale(0.1, -0.1)`} opacity="0.75">
          <rect width="200" height="400" x="-100" y="-200" fill="white" />
          {drawnWorld}
        </g>
      </svg>
    );
  }
}

function drawBall(ball, index) {
  return (
    <g transform={`translate(${ball.x} ${ball.y}) rotate(${ball.angle / Math.PI * 180})`} key={index}>
      <circle cx="0" cy="0" r="2" stroke="black" strokeWidth="0.5" fill="yellow" />
    </g>
  );
}

function drawShip(ship) {
  return (
    <g transform={`translate(${ship.x} ${ship.y}) rotate(${ship.angle / Math.PI * 180})`} key={ship.playerId}>
        <circle cx="0" cy="0" r="3" stroke="black" strokeWidth="0.5" fill={teamFills[ship.team]} />
        
        {drawBoosters(ship)}
        <g transform="rotate(90) scale(-1, 1)">
          <circle cx="0" cy="0" r="2.5" stroke="green" strokeWidth="1" fill="none" strokeDasharray="15.70795" strokeDashoffset={(1-ship.percentBoostLeft) * 15.70795}/>
        </g>
        <line x1="0" y1="0" x2="0" y2="4" stroke="black" />
    </g>
  );
}

function drawBoosters(ship) {
  const flames = [];

  let forwardBoost = 0;
  if (ship.controls.boost && ship.percentBoostLeft > 0.01) {
    forwardBoost++;
  }

  if (ship.controls.up) {
    forwardBoost++;
  }

  if (forwardBoost >= 2) {
    flames.push(<polygon points="-3,-2 -1,-2 -2,-5" x="-20" fill="orange"/>);
    flames.push(<polygon points="3,-2 1,-2 2,-5" x="-20" fill="orange"/>);
  }

  if (forwardBoost >= 1) {
    flames.push(<polygon points="-3,-2 -1,-2 -2,-3" x="-20" fill="red"/>);
    flames.push(<polygon points="3,-2 1,-2 2,-3" x="-20" fill="red"/>);
  }

  if (ship.controls.down) {
    flames.push(<polygon points="-3,2 -1,2 -2,3" x="-20" fill="red"/>);
    flames.push(<polygon points="3,2 1,2 2,3" x="-20" fill="red"/>);
  }

  return flames;
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

function drawGoal(goal, index) {
  const topLeft = {
    x: goal.x - goal.width / 2,
    y: goal.y - goal.height / 2
  }

  return <g transform={`translate(${topLeft.x} ${topLeft.y})`} key={index}>
    <rect width={goal.width} height={goal.height} fill={teamFills[goal.team]} />
  </g>;
}
