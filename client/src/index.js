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
  // exampleSocket.send("Here's some text that the server is urgently awaiting!");
};

exampleSocket.onmessage = (message) => {
  console.log(message);
  const payload = JSON.parse(message.data);
  if (payload.messageType === 'renderedWorld') {
    render(payload.world);
  }
};