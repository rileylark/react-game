import React from 'react'
import Board from './Board';

import './App.css';

function App({ world, camera, gameState, localPlayer }) {
  return (
    <div className="App">
      {Board({ world, camera, localPlayer, gameState })}
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
        <table>
          <tbody>
            <tr>
              <th>Blue</th>
              <th>Red</th>
              <th>Time Left</th>
            </tr>
            <tr>
              <td>
                {gameState.score.blue}
              </td>
              <td>
                {gameState.score.red}
              </td>
              <td> {secondsLeft}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ width: '200px' }}>
          <table>
            <tbody>
              <tr>
                <td>Arrows</td><td>Turn & move</td>
              </tr>
              <tr>
                <td>Space</td><td>Boost</td>
              </tr>
              <tr>
                <td>W,A,S,D</td><td>Pass & shoot</td>
              </tr>
            </tbody>
          </table>
        </div>
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
