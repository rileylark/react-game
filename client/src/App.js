import React from 'react'
import Board from './Board';

import './App.css';

function App({world, camera}) {
  return (
    <div className="App">
      {Board({world, camera})}
    </div>
  );
}

export default App;
