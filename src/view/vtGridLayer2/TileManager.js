export default class TileManager {
  constructor() {
    this.tiles = {};
    this.index = {};
  }

  toIndex(coords) {
    return `${coords.x.toString()}-${coords.y.toString()}`;
  }

  set(coords, value) {
    var z = coords.z;
    this.tiles = this.tiles || {};
    this.tiles[z] = this.tiles[z] || {};
    this.tiles[z][this.toIndex(coords)] = value;
    //setLookup
    return
  }

  get(coords) {
    if (this.tiles && this.tiles[coords.z]) return this.tiles[coords.z][this.toIndex(coords)];
  }

  remove(coords) { 
    return delete this.tiles[coords.z][this.toIndex(coords)]
  }

  // This lookup is used in two cases: 1) a geohash push notification is received,
  // and we need to figure out which this.tiles to re-render. 2) As a geohash push
  // notification is received, we need to invalidate all other this.tiles affected by
  // that are affected.
  setLookup(geohashes, coords) {
    this.index = this.index || {};
    geohashes = geohashes || [];
    return geohashes.map((geohash) => {
      this.index[geohash] = this.index[geohash] || {};
      this.index[geohash][this.toIndex(coords)] = true;
    })
  }

  lookup(geohash) {
    return this.index[geohash]
  }

  invalidate(coords) {
    Object.keys(this.index || {}).map((z) => {
      // SKIP THE TILE AT THE CURRENT ZOOM LEVEL z == coords.z. We're
      // working on it now!
      if (z < coords.z) {
        // Only one parent exists for parent this.tiles
        var x = Math.floor(coords.x/Math.pow(2, coords.z-z));
        var y = Math.floor(coords.y/Math.pow(2, coords.z-z));
        var tileIndex = z.toString()+'-'+x.toString()+'-'+y.toString();
        if (this.index[z][tileIndex]) delete this.index[z][tileIndex];
      } else {
        var xRange = Math.pow(2, z-coords.z)
        var startX = coords.x*xRange;
        for (var x = startX; x < startX+xRange; x++) {
          var yRange = Math.pow(2, z-coords.z)
          var startY = coords.y*yRange;
          for (var y = startY; y < startY+yRange; y++) {
            console.log('invalidating', coords)
            var tileIndex = z.toString()+'-'+x.toString()+'-'+y.toString();
            if (this.index[z][tileIndex]) delete this.index[z][tileIndex];
          }
        }
      }
    })
  }
}
