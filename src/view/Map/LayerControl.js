import React from 'react';
import overmind from "../../overmind"
import { FeatureGroup, LayersControl, GeoJSON } from 'react-leaflet';
import './styles.css';
import VTLayer from '../vtGridLayer2';
import {v1 as uuid} from "uuid";
const { Overlay } = LayersControl;

export default function LayerControl(props) {
  const {actions, state} = overmind();
  const myActions = actions.view.LayerControl;
  const myState = state.view.Control;
  const layer = state.soils.layer;

  return (
    <LayersControl 
      position='topright'>
        <Overlay 
        checked={true}
        onChange={() => myActions.toggleCropLayer({})}
        name='test'
        key={'overlay'}>
        <VTLayer
          key={'RasterLayer-'}
          zIndex={1000}
          layer={layer}
        />
      </Overlay>
    </LayersControl>
  )
}
