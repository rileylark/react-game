import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

import { makeInstance } from './gameState/game';



let gameInstance = null;

function render(state) {
  ReactDOM.render(
    App(state),
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
      walls: [],
      goals: [],
    }
  },
  gameState: {
    score: {
      blue: 0,
      red: 0,
    }
  },
  localPlayer: {}
};

render(state);


// const exampleSocket = new WebSocket("ws://104.198.51.152:3001");
const exampleSocket = new WebSocket('ws://localhost:3001');
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
  'Space': 'boost',
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

function renderMovingThingsToState(payload) {
  const localPlayer = payload.players.find((player) => player.playerId === state.myPlayerId);
  const cameraPosition = localPlayer
    ? {
      x: cameraSmoothing.player * localPlayer.body.position[0] + cameraSmoothing.camera * state.camera.x,
      y: cameraSmoothing.player * localPlayer.body.position[1] + cameraSmoothing.camera * state.camera.y,
    }
    : { x: 0, y: 0 };

  state = {
    ...state,
    localPlayer,
    camera: cameraPosition,
    world: {
      ...state.world,
      ...payload,
    }
  };
}

function renderInitialStateToState(payload) {
  state = {
    ...state,
    myPlayerId: payload.yourId,
    world: {
      ...state.world,
      level: gameInstance.renderLevel(),
    }
  };
}

function renderGameStateToState(payload) {
  state = {
    ...state,
    gameState: payload.gameState,
  };
}

function startRenderingFromLocal() {

  setInterval(() => {
    gameInstance.animate(Date.now());
    renderMovingThingsToState(gameInstance.renderMovingThings());
    render(state);
  }, 1000/60);

}

exampleSocket.onmessage = (message) => {
  const payload = JSON.parse(message.data);
  if (payload.messageType === 'movingThingUpdate') {
    gameInstance.applyAuthorativeUpdate(payload);
  } else if (payload.messageType === 'initialSetup') {
    gameInstance = makeInstance(payload.level);
    startRenderingFromLocal();
    renderInitialStateToState(payload);
  } else if (payload.messageType === 'gameState') {
    renderGameStateToState(payload);
  } else if (payload.messageType === 'playerLeft') {
    gameInstance.removePlayer(payload.data.playerId);
  } else if (payload.messageType === 'newControls') {
    gameInstance.mergeNewControls(payload.data.playerId, payload.data.newControls);
  }
};