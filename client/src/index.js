import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

function render(state) {
  ReactDOM.render(
    <App wholeState={state} />,
    document.getElementById('root')
  );
}

const cameraSmoothing = {
  player: 0.2,
  camera: 0.8,
}

let state = {
  camera: {
    x: 0,
    y: 0,
  },
  world: {
    players: [],
    level: {
      walls: []
    }
  }
};

render(state);


const exampleSocket = new WebSocket("ws://localhost:3001");
exampleSocket.onopen = function (event) {
  setInterval(() => {
    exampleSocket.send(JSON.stringify({
      messageType: 'pushUp'
    }));
  }, 5000);
};

const controlMap = {
  'ArrowUp': 'up',
  'ArrowDown': 'down',
  'ArrowLeft': 'left',
  'ArrowRight': 'right',
};

document.addEventListener('keydown', (e) => {
  const controlDown = controlMap[e.code];
  if (controlDown) {
    exampleSocket.send(JSON.stringify({
      messageType: 'controlChange',
      controls: {
        [controlDown]: true
      }
    }));
  }
});

document.addEventListener('keyup', (e) => {
  const controlUp = controlMap[e.code];
  if (controlUp) {
    exampleSocket.send(JSON.stringify({
      messageType: 'controlChange',
      controls: {
        [controlUp]: false
      }
    }));
  }
});

exampleSocket.onmessage = (message) => {
  const payload = JSON.parse(message.data);
  if (payload.messageType === 'renderedWorld') {
    const localPlayer = payload.players.find((player) => player.playerId === state.myPlayerId);
    console.log("Got local player", state.myPlayerId, localPlayer);
    const cameraPosition = localPlayer
      ? {
        x: cameraSmoothing.player * localPlayer.x + cameraSmoothing.camera * state.camera.x,
        y: cameraSmoothing.player * localPlayer.y + cameraSmoothing.camera  * state.camera.y,
      }
      : { x: 0, y: 0 };

    state = {
      ...state,
      camera: cameraPosition,
      world: {
        ...state.world,
        players: payload.players,
        balls: payload.balls,
      }
    };

    render(state);
  } else if (payload.messageType === 'initialSetup') {
    state = {
      ...state,
      myPlayerId: payload.yourId,
      world: {
        ...state.world,
        level: payload.level,
      }
    };
  }
};