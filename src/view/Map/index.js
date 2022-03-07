import React from 'react';
import LayerControl from './LayerControl'
import md5 from 'md5';
import {v4 as uuid} from 'uuid';
import _ from 'lodash'
import { CircleMarker, GeoJSON, Map as LeafletMap, Marker, TileLayer } from 'react-leaflet'
import './styles.css'
import LegendControl from './LegendControl'

import overmind from '../../overmind'

export default function Map() {
  const { actions, state } = overmind();
  const myActions = actions.view.Map;
  const myState = state.view.Map;

  return (
      <LeafletMap 
        bounds={myState.bounds} 
        center={myState.center}
        onMoveStart={(e) => {myActions.mapMoveStarted()}}
        onClick={(e) => {myActions.mapClicked(e)}}
        onMoveend={(e) => {myActions.mapMoved({center:e.target.options.center, zoom: e.target._zoom})}}
        zoomControl={false}>
        zoom={myState.zoom || 15}
        ref='map'
        <LayerControl />
        <LegendControl position={'bottomright'}/>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        />
        <TileLayer
          url="https://stamen-tiles-{s}.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}{r}.png"
          minZoom={0}
          maxZoom={20}
          attribution=""
        />
      </LeafletMap>
  );
}
