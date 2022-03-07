// @flow
import L from 'leaflet'
import { GridLayer, MapLayer, PropTypes } from 'react-leaflet'
import PTypes from 'prop-types'
import type { GridLayerProps } from './types'
import TileManager from './TileManager';
import {ov as overmind} from '../../overmind'

L.GridLayer.GeoJSON = L.GridLayer.extend({
    layer: {},

    setLayer: function(l) {
      this.layer = l;
    },

    initialize: async function (options) {
      L.setOptions(this, options);
      L.GridLayer.prototype.initialize.call(this, options);
      this.tiles = new TileManager();
      this.actions = overmind.actions;
    },

    createTile: function (coords) {
      // create a <canvas> element for drawing
      let tile = this.tiles.get(coords)
      if (tile) return tile;

      tile = L.DomUtil.create('canvas', 'leaflet-tile');
      // setup tile width and height according to the options
      var size = this.getTileSize();
      tile.width = size.x;
      tile.height = size.y;
      // cache the tile
      this.tiles.set(coords, tile)
      // render the tile
      this.actions.soils.createTile({coords, layer: this.layer, tile, tiles: this.tiles});
      return tile;
    },


    setOpacity: function (color, opacity) {
      if (opacity) {
        var color = color || '#03f';
        if (color.iscolorHex()) {
          var colorRgb = color.colorRgb();
          return "rgba(" + colorRgb[0] + "," + colorRgb[1] + "," + colorRgb[2] + "," + opacity + ")";
        } else {
          return color;
        }
      } else {
        return color;
      }
    }
})


let LeafletGridLayer = L.GridLayer.GeoJSON;

export default class VTLayer<
  LeafletElement: LeafletGridLayer,
  Props: GridLayerProps,
> extends MapLayer<LeafletElement, Props> {
  static propTypes = {
    children: PropTypes.children,
    opacity: PTypes.number,
    zIndex: PTypes.number,
    layer: PTypes.object,
  }

  createLeafletElement(props: Props): LeafletElement {
    this.layer = props.layer;
    let options = {
      maxZoom: 20,  // max zoom to preserve detail on; can't be higher than 24
      tolerance: 3, // simplification tolerance (higher means simpler)
      extent: 4096, // tile extent (both width and height)
      buffer: 64,   // tile buffer on each side
      debug: 0,     // logging level (0 to disable, 1 or 2)
      lineMetrics: false, // whether to enable line metrics tracking for LineString/MultiLineString features
      promoteId: 'mukey',    // name of a feature property to promote to feature.id. Cannot be used with `generateId`
      generateId: false,  // whether to generate feature ids. Cannot be used with `promoteId`
      indexMaxZoom: 5,       // max zoom in the initial tile index
      indexMaxPoints: 100000, // max number of points per tile in the index
    }

    return new LeafletGridLayer(options);
  }

  updateLeafletElement(fromProps: Props, toProps: Props) {
    const { opacity, zIndex } = toProps
    if (opacity !== fromProps.opacity) {
      this.leafletElement.setOpacity(opacity)
    }
    if (zIndex !== fromProps.zIndex) {
      this.leafletElement.setZIndex(zIndex)
    }
    this.leafletElement.setLayer(toProps.layer);
  }

  render() {
    return null
  }
}
