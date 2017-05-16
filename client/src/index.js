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

render();

const exampleSocket = new WebSocket("ws://localhost:3001");
exampleSocket.onopen = function (event) {
  setInterval(() => {
    exampleSocket.send(JSON.stringify({
      messageType: 'pushUp'
    }));
  }, 5000);
};

exampleSocket.onmessage = (message) => {
  const payload = JSON.parse(message.data);
  if (payload.messageType === 'renderedWorld') {
    render(payload.world);
  }
};