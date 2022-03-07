import React from 'react';
import './App.css';

import Login from './Login'
import Map from './Map'
import SoilInfo from './SoilInfo'

import overmind from '../overmind'

function App() {
  const { state } = overmind();

  if (!state.view.Login.loggedIn) {
    return <Login />
  }

  return (
    <div className="App">
      <SoilInfo />
      <Map />
    </div>
  );
}

export default App;
