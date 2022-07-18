process.env.NODE_TLS_REJECT_UNAUTHORIZED=0;
import * as oada from '@oada/client';
import fs from 'fs';
import gvt from 'geojson-vt';
//import data from './testVtTile.json';
//import tippSoil from './tippSoil.json';
import Promise from 'bluebird';
/*
const oada = require('@oada/client');
const gvt = require('geojson-vt');
let data = require('./testVtTile.json');
let tippSoil = require('./tippSoil.json');
let Promise = require('bluebird').Promise;
*/
let data = JSON.parse(fs.readFileSync('./testVtTile.json'));
let tippSoil = JSON.parse(fs.readFileSync('./tippSoil.json'));

let tree =  {
  bookmarks: {
    _type: 'application/vnd.oada.bookmarks.1+json',
    _rev: 0,
    soils: {
      _type: 'application/json',
      _rev: 0,
      'tiled-maps': {
        _type: 'application/json',
        'ssurgo-map-units': {
          _type: 'application/json',
          _rev: 0,
          'geojson-vt-index': {
            _type: 'application/json',
            _rev: 0,
            z: {
              '*': {
                _type: 'application/json',
                _rev: 0,
                x: {
                  '*': {
                    _type: 'application/json',
                    _rev: 0,
                    y: {
                      '*': {
                        _type: 'application/json',
                        _rev: 0,
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

async function singleTestFile() {
  let conn = await oada.connect({
    domain: 'https://localhost',
    token: 'def'
  })

  await conn.put({
    path: `/bookmarks/soils/tiled-maps/ssurgo-map-units/geojson-vt-index/z/15/x/8468/y/12346`,
    data,
    tree,
  })
  process.exit()
}

async function manyFiles() {

  let options = {
    maxZoom: 17,  // max zoom to preserve detail on; can't be higher than 24
    tolerance: 3, // simplification tolerance (higher means simpler)
    extent: 4096, // tile extent (both width and height)
    buffer: 64,   // tile buffer on each side
    debug: 0,     // logging level (0 to disable, 1 or 2)
    lineMetrics: false, // whether to enable line metrics tracking for LineString/MultiLineString features
    //promoteId: 'mukey',    // name of a feature property to promote to feature.id. Cannot be used with `generateId`
    generateId: false,  // whether to generate feature ids. Cannot be used with `promoteId`
    indexMaxZoom: 17,       // max zoom in the initial tile index
    indexMaxPoints: 0, // max number of points per tile in the index
  }

  let g = gvt(tippSoil, options);

  let conn = await oada.connect({
    domain: 'https://localhost',
    token: 'def'
  })
  console.log('tiles', Object.keys(g.tiles).length);
  console.log('coords', g.tileCoords.length);
  //process.exit();

  setInterval(() => console.log('hi'),3000)

  await Promise.each(g.tileCoords, async ({z,x,y}, i) => {
    //let z = Math.log2(t.z2)
    //let z = t.z;
    //console.log(t, z, t.x, t.y);
    let tile = g.getTile(z, x, y);
    console.log('putting', i, '-', z, x, y)
    await conn.put({
      path: `/bookmarks/soils/tiled-maps/ssurgo-map-units/geojson-vt-index/z/${z}/x/${x}/y/${y}`,
      data: tile,
      tree,
    })
      .catch(err => {
        console.log("WAS AN ERROR!")
        console.log(err)
      })
  })
  .catch(err => {
    console.log("WAS AN ERROR22222!")
    console.log(err)
  })

  process.exit()
}
manyFiles();
//singleTestFile()
