import {debounce, mutate, pipe} from 'overmind'
import md5 from 'md5';
import gjArea from '@mapbox/geojson-area';
import _ from 'lodash'
import Promise from 'bluebird'
import BBox from '@turf/bbox'
import GeoJSON from 'geojson'
import pip from 'point-in-polygon'

export default {
  async zoomTo({state}, {latitude, longitude, zoom}) {
    const myState = _.get(state, 'view.Map');
    myState.center = [latitude, longitude];
    myState.zoom = zoom;
    await Promise.delay(500);
    myState.center = null;
    myState.zoom = null;
  },
  styleField: {
    highlight({state}, fieldId) {
      if (fieldId) {
        const myState = _.get(state, 'view.Map');
        _.set(myState, `fieldStyles.${fieldId}`, {weight: 5})
      }
    },
    unhighlight({state}, fieldId) {
      if (fieldId) {
        const myState = _.get(state, 'view.Map');
        _.set(myState, `fieldStyles.${fieldId}`, {weight: 3})
      }
    }
  },
  async unselectField({state, actions}) {
    const myActions = _.get(actions, 'view.Map');
    const myState = _.get(state, 'view.Map');
    if (myState.selectedField) {
      actions.view.FieldDetails.close();
      myActions.styleField.unhighlight(myState.selectedField);
      await Promise.delay(200)
      myState.selectedField = null;
    }
  },
  onFieldClick({state, actions}, {id}) {
    const myActions = _.get(actions, 'view.Map');
    const myState = _.get(state, 'view.Map');
    const drawing = _.get(myState, `BoundaryDrawing.drawing`);
    if (!drawing) {
      myActions.styleField.unhighlight(myState.selectedField);
      myState.selectedField = id;
      myActions.styleField.highlight(id);
      actions.view.FieldDetails.open();
    }
  },
  async zoomBounds({state}, props) {
    const myState = _.get(state, 'view.Map');
    const fields = _.compact(_.map(myState.fields, (f) => {
      if (!f.boundary) return null; //Don't include fields without boundaries
      return {geo: f.boundary}
    }));
    const featureCollection = GeoJSON.parse(fields, {GeoJSON: 'geo'})
    const bounds = BBox(featureCollection)
    if (isFinite(bounds[0]) && isFinite(bounds[1]) && isFinite(bounds[2]) && isFinite(bounds[3])) {
      myState.bounds = [[bounds[1], bounds[0]], [bounds[3], bounds[2]]];
    }
  },
  mapMoveStarted({state}) {
    state.view.Map.moving = true;
  },
  toggleCropLayerVisibility({actions}, props) {
    actions.view.Map.toggleCropLayer(props);
  },
  handleLocationFound({actions}, props) {
    actions.view.Map.setCurrentLocation(props);
  },
  handleFieldNoteClick({actions}, props) {
    actions.view.Map.mapToFieldPolygon(props);
  },
  async mapClicked({state, actions}, props) {
    let zoom = state.view.Map.zoom;
    let lon = props.latlng.lng;
    let lat = props.latlng.lat;
    let xtile = parseInt(Math.floor( (lon + 180) / 360 * Math.pow(2,zoom) ));
    let ytile = parseInt(Math.floor( (1 - Math.log(Math.tan(lat*Math.PI/180) + (1 / Math.cos(lat*Math.PI/180))) / Math.PI) / 2 * Math.pow(2,zoom)));

    // LatLng -> CRS (web mercator)
    let pt = {x:projectX(props.latlng.lng), y: projectY(props.latlng.lat)};
    // CRS -> to geojson-vt [0..extent] tile coordinates
    let ptb = transformPoint(pt.x, pt.y, 4096, Math.pow(2,zoom), xtile, ytile)

    console.log(props);
    let lay = props.target._layers[19];
    let feats = lay ? (lay.tiles.get(zoom, xtile, ytile) || {}).features || []: [];
    let mukeys = feats.filter(feat => 
      feat.geometry.some(f => pip(ptb, f))
    ).map(feat => feat.id);

    let mukey = mukeys[0];
    let mapUnit;

    if (mukey) {
      let response = await actions.oada.get({
        path: `/bookmarks/soils/tabular/mapunit/${mukey}`
      })
      mapUnit = response.data;
      //Retrieve components
      await Promise.each(Object.keys(mapUnit.components), async cokey => {
        let cResponse = await actions.oada.get({
          path: `/bookmarks/soils/tabular/component/${cokey}`
        })
        mapUnit.components[cokey] = cResponse.data;

        //Retrieve component horizons
        mapUnit.components[cokey].horizons = await Promise.map(cResponse.data.horizons || [], async (hkey, i) => {
          let hResponse = await actions.oada.get({
            path: `/bookmarks/soils/tabular/horizon/${hkey}`
          })
          return hResponse.data;
        })
      })
      console.log(mapUnit);
    }
    

  },
  undoDrawPoint({actions, state}, props) {
    actions.view.Map.undo(props);
    actions.notes.recalculateNoteArea();
    actions.notes.getNoteBoundingBox();
  },
  markerDragEnded({actions, state}) {
    let {type, id} = state.notes.selectedNote;
    state.view.Map.dragging = false;
    let geojson = state.notes[type][id].boundary.geojson;
    let {area, bbox, centroid} = actions.view.Map.getGeometryABCs(geojson);
    state.notes[type][id].boundary = { area, bbox, centroid, geojson }

  },
  markerDragStarted({state}) {
    state.view.Map.dragging = true;
  },
  markerDragged({actions, state}, {latlng, i}) {
    let {type, id} = state.notes.selectedNote;
    state.notes[type][id].boundary.geojson.coordinates[0][i] = [latlng.lng, latlng.lat];
  },
  handleCurrentLocationButton({state, actions}) {
    actions.view.Map.setMapToCurrentLocation()
  },
  mapMoved({state, actions}, props) {
    actions.view.Map.setMapLocation(props);
    state.view.Map.moving = false;
  },
  setMapLocation({state}, {center, zoom}) {
    state.view.Map.center = [center[0], center[1]];
    state.view.Map.zoom = zoom;
  },
  setMapToCurrentLocation({state}) {
    let loc = state.get('App.model.current_location');
    if (loc) state.set('view.Map.center', [loc.lat, loc.lng]);
  },
  recalculateArea({state}, boundary) {
    if (boundary && boundary.coordinates[0].length > 2) {
      return gjArea.boundary(boundary)/4046.86;
    } else return 0.0
  },
  computeBoundingBox({}, geojson) {
    let bbox;
    let coords = geojson.geometries ? geojson.geometries[0].coordinates[0] : geojson.coordinates[0];
    let north = coords[0][1];
    let south = coords[0][1];
    let east = coords[0][0];
    let west = coords[0][0];
    (geojson.geometries || [geojson]).forEach(g =>
      g.coordinates[0].forEach(c => {
        if (c[1] > north) north = c[1];
        if (c[1] < south) south = c[1];
        if (c[0] > east) east = c[0];
        if (c[0] < west) west = c[0];
      })
    )
    bbox = {north, south, east, west};

    return bbox;
  },
  getGeometryABCs({state, actions}, geojson) {
    if (geojson) {
      let area = 0.0;
      let bbox;
      if (geojson.geometries) {
        geojson.geometries.forEach(g => {
          area += g.coordinates[0].length > 2 ? gjArea.geometry(g)/4046.86 : 0.0;
        })
      } else {
        area = geojson.coordinates[0].length > 2 ? gjArea.geometry(geojson)/4046.86 : 0.0;
      }
      bbox = actions.view.Map.computeBoundingBox(geojson);
      let centroid = [(bbox.north + bbox.south)/2, (bbox.east + bbox.west)/2];
      return {area, bbox, centroid}
    }
  },
  fitGeometry({state, actions}, props) {
    let note = state.notes[props.type][props.id];
    if (note.boundary && note.boundary.bbox) {
      let bbox  = note.boundary.bbox;
      state.view.Map.bounds = [
        [bbox.south, bbox.west],
        [bbox.north, bbox.east]
      ]
    }
  }
}

function setCurrentLocation({props, state}) {
  let obj = {
    lat: props.lat,
    lng: props.lng,
  }
  state.set('App.model.current_location', obj);
}

function undo({props, state}) {
  let id = state.get('notes.selectedNote');
	let points = state.get(`notes.notes.${id}.boundary.geojson.coordinates.0`);
  if (points.length > 0) {
    state.pop(`notes.notes.${id}.boundary.geojson.coordinates.0`);
  }
}

function mapToFieldPolygon({props, state}) {
  var field = state.get(`Fields.${props.id}`);
  if (field) state.set('view.Map.center', field.boundary.centroid);
}

function toggleCropLayer({props, state}) {
  var vis = state.get(`view.Map.cropLayers.${props.crop}.visible`);
  state.set(`view.Map.cropLayers${props.crop}.visible`, !vis);
}

function transformPoint(x, y, extent, z2, tx, ty) {
    return [
        Math.round(extent * (x * z2 - tx)),
        Math.round(extent * (y * z2 - ty))];
}

function projectX(x) {
    return x / 360 + 0.5;
}

function projectY(y) {
    const sin = Math.sin(y * Math.PI / 180);
    const y2 = 0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI;
    return y2 < 0 ? 0 : y2 > 1 ? 1 : y2;
}
