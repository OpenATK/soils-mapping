import React from 'react';
import Control from 'react-leaflet-control';
import overmind from "../../overmind"
import './legend.css';
import md5 from 'md5'

export default function LegendControl(props) {
  const { actions, state } = overmind();
  const myState = actions.view.Map;
  let legend = state.soils.legend;
  
  let legendPieces = Object.keys(legend).map(key => 
    <span key={md5(JSON.stringify(legend[key]))}>
      <i style={{background: legend[key].color}} key={md5(JSON.stringify(legend[key]))+'-i'}></i>
      {legend[key].value}
    </span>
  )

  return(
    <Control
      position={props.position}>
      <div
        className={(legendPieces.length > 0) ? 'legend-control' : 'hidden'}>
        {legendPieces}
      </div>
    </Control>
  );
}
