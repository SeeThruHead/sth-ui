export type Zoom = { readonly scale: number; readonly x: number; readonly y: number }

export type Size = { readonly width: number; readonly height: number }

export const unzoomed: Zoom = { scale: 1, x: 0, y: 0 }

export const isZoomed = (zoom: Zoom): boolean => zoom.scale > 1

export const clampPan = (zoom: Zoom, size: Size): Zoom => {
  const maxX = (size.width * (zoom.scale - 1)) / 2
  const maxY = (size.height * (zoom.scale - 1)) / 2

  return {
    scale: zoom.scale,
    x: Math.max(-maxX, Math.min(maxX, zoom.x)),
    y: Math.max(-maxY, Math.min(maxY, zoom.y))
  }
}

export const toggleZoom = (zoom: Zoom, maxScale: number): Zoom =>
  isZoomed(zoom) ? unzoomed : { scale: Math.min(2, maxScale), x: 0, y: 0 }

export const zoomAt = (
  zoom: Zoom,
  delta: number,
  maxScale: number,
  size: Size,
  offset: { readonly x: number; readonly y: number }
): Zoom => {
  const scale = Math.max(1, Math.min(maxScale, zoom.scale + delta))
  if (scale === 1) return unzoomed
  const ratio = scale / zoom.scale
  const offsetX = offset.x + zoom.x
  const offsetY = offset.y + zoom.y

  return clampPan({ scale, x: offsetX * (1 - ratio) + zoom.x * ratio, y: offsetY * (1 - ratio) + zoom.y * ratio }, size)
}

export const panBy = (zoom: Zoom, dx: number, dy: number, size: Size): Zoom =>
  clampPan({ scale: zoom.scale, x: zoom.x + dx, y: zoom.y + dy }, size)

export const zoomTransform = (zoom: Zoom): string =>
  `scale(${zoom.scale}) translate(${zoom.x / zoom.scale}px, ${zoom.y / zoom.scale}px)`
