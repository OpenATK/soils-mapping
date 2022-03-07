import React from 'react'
import overmind from "../../overmind"
import './styles.css'


export default function SoilInfo() {
  const { actions, state } = overmind();
  let conn = state.oada.defaultConn;
  let type = state.soils.type || 'mapunit';
  let keys = Object.keys(Object.values(state.oada[conn].bookmarks.soils.tabular[type] || {})[0] || {});

  return (
    <div 
      className={'soil-info'}
      style={{'flex-direction':'column'}}>
      <div onClick={evt => actions.soils.mapDataLayer({type: 'mapunit', newType: true})}>Map Unit</div>
      <div onClick={evt => actions.soils.mapDataLayer({type: 'component', newType: true})}>Component</div>
      <div onClick={evt => actions.soils.mapDataLayer({type: 'horizon', newType: true})}>Horizon</div>
      {keys
        .filter(key => key.charAt(0) !== '_')
        .map(key =>
          <div onClick={evt => actions.soils.mapDataLayer({layer: key})}>{key}</div>
        )
      }
    </div>
  );
}
