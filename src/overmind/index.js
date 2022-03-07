import { createHook, createConnect } from "overmind-react"
import { createOvermind } from "overmind";

import { namespaced } from 'overmind/config'

import * as view from './view'
import * as soils from './soils'
import * as app from './app'
import * as OADAManager from './OADAManager'
import oadaCacheOvermind from '@oada/oada-cache-overmind'

const oada = oadaCacheOvermind('oada');

export const config = namespaced({
  app,
  oada,
  OADAManager,
  view,
  soils,
})

export const connect = createConnect();

export const ov = createOvermind(config);

export default createHook()
