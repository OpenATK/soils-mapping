// @flow

import type { Node } from 'react'

export type GridLayerOptions = {
  tileSize?: number | LeafletPoint,
  opacity?: number,
  layer?: object,
  updateWhenIdle?: boolean,
  updateWhenZooming?: boolean,
  updateInterval?: number,
  zIndex?: number,
  bounds?: LeafletLatLngBounds,
  minZoom?: number,
  maxZoom?: number,
  minNativeZoom?: number,
  maxNativeZoom?: number,
  noWrap?: boolean,
  className?: string,
  keepBuffer?: number,
} & MapLayerProps

export type MapComponentProps = { pane?: string }

export type MapLayerProps = { children?: Node } & MapComponentProps

export type GridLayerProps = MapLayerProps & GridLayerOptions
