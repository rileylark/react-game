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


let state = {
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

    state = {
      ...state,
      world: {
        ...state.world,
        players: payload.players
      }
    };

    render(state);
  } else if (payload.messageType === 'initialSetup') {
    state = {
      ...state,
      world: {
        ...state.world,
        level: payload.level
      }
    }
  }
};