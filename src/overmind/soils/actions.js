import {v1 as uuid} from 'uuid'
import _ from 'lodash';
import Promise from 'bluebird'
import tree from './tree'
import draw from './draw'

export default {
  async initialize({state, actions}, props) {
    let conn = state.oada.defaultConn;
    await actions.oada.get({
      path: '/bookmarks/soils/tabular/mapunit',
      tree,
    })
    let mu = state.oada[conn].bookmarks.soils.tabular.mapunit;
    /*
    await Promise.map(Object.keys(mu), async (key) => {
      await actions.oada.get({
        path: `/bookmarks/soils/tabular/mapunit/${key}`,
        tree,
      })
    }, {concurrency: 10})
    */
    await actions.oada.get({
      path: '/bookmarks/soils/tabular/component',
      tree,
    })
    await actions.oada.get({
      path: '/bookmarks/soils/tabular/horizon',
      tree,
    })
    actions.soils.mapDataLayer({layer:'taxorder', type: 'component'})
  },
  // Prepare mapunit->unique value hash table. Then a rendering layer will
  // select unique colors for each unique value
  mapDataLayer({state, actions}, {layer, type, newType}) {
    let conn = state.oada.defaultConn;
    let soils = state.oada[conn].bookmarks.soils.tabular;
    let legend = {};
    if (newType) state.soils.type = type;

    if (layer) {
      let data = {}
      Object.keys(soils.mapunit).forEach(mukey => {
        if (state.soils.type === 'component') {
          if (soils.mapunit[mukey].components) {

            let cokey = Object.keys(soils.mapunit[mukey].components)[0];
            let comp = soils.component[cokey];
            if (comp) {
              data[mukey] = {
                value: comp[layer] || 'N/A',
                color: getRandomColor()
              }
            } else data[mukey] = {
              value: 'N/A',
              color: getRandomColor()
            }
            legend[data[mukey].value] = {
              color: data[mukey].color,
              value: data[mukey].value
            }
          }
        } else {
          data[mukey] = {
            value: soils.mapunit[mukey][layer],
            color: getRandomColor(),
          }
          legend[data[mukey].value] = {
            color: data[mukey].color,
            value: data[mukey].value
          }
        }
      })
      state.soils.layer = data;
      state.soils.legend = legend;

    }
  },
  async fetchVtTile({actions, effects, state}, props) {
    let connection_id = state.oada.defaultConn;
    let path = `/bookmarks/soils/tiled-maps/ssurgo-map-units/geojson-vt-index/z/${props.coords.z}/x/${props.coords.x}/y/${props.coords.y}`;
    //let path = `/bookmarks/soils/tiled-maps/ssurgo-map-units/geojson-vt-index/z/15/x/8468/y/12346`;
    let data = await effects.oada.get({
      path,
      connection_id,
    }).then(r => r.data).catch(err => {});
    return data;
  },

  async createTile({actions, state}, props) {
    if (props.coords.z) {
      let vtTile = await actions.soils.fetchVtTile(props);
      if (vtTile) props.vtTile = vtTile;
      if (vtTile) {
        await actions.soils.drawVtFeatures(props);
        props.tiles.set(props.coords, props.tile)
      }
    }
  },
  async drawVtFeatures({actions, state}, props) {
    let features = props.vtTile ? props.vtTile.features : [];
    let ctx = props.tile.getContext('2d');
    await Promise.each(features, async (feature) => {
      await draw.drawFeature(ctx, feature, props.layer);
    })
    props.tiles.set(props.coords, props.tile);
  }
}     

function getRandomColor() { 
  var letters = '0123456789ABCDEF'; 
  var color = '#'; 
  for (var i = 0; i < 6; i++) { 
    color += letters[Math.floor(Math.random() * 16)]; 
  } 
  return color; 
}
