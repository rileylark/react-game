import React from 'react'
import Board from './Board';

import './App.css';

function App({ world, camera, gameState, localPlayer }) {
  return (
    <div className="App">
      {Board({ world, camera })}
      {Scoreboard({ gameState, localPlayer })}
    </div>
  );
}

function Scoreboard({ gameState, localPlayer }) {
  if (gameState.mode === 'playing') {


    let secondsLeft = "<< loading >>";
    if (gameState.endTime && gameState.currentTime) {
      secondsLeft = Math.round((gameState.endTime - gameState.currentTime) / 1000);
    }

    return (
      <div className="scoreboard">
        <h1>
          Blue: {gameState.score.blue}
        </h1>
        <h1>
          Red: {gameState.score.red}
        </h1>
        <p>Time left: {secondsLeft}</p>
        <svg width="200" height="10">
          <rect width={localPlayer.percentBoostLeft * 200 } height="10" fill="red" />
        </svg>
      </div>
    );
  } else {
    return (
      <div className="scoreboard">
      <h1> Game Over! {gameState.winner} wins!</h1>
      </div>
    )
  }
}

export default App;
