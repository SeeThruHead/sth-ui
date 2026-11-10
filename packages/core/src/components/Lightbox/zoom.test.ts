import { describe, expect, it } from "@effect/vitest"
import { clampPan, isZoomed, panBy, toggleZoom, unzoomed, zoomAt, zoomTransform } from "./zoom.ts"

const size = { width: 400, height: 200 }

describe("lightbox zoom, as useLightboxZoom", () => {
  it("toggles between fitted and twice the size, capped by the max scale", () => {
    expect(toggleZoom(unzoomed, 3)).toEqual({ scale: 2, x: 0, y: 0 })
    expect(toggleZoom(unzoomed, 1.5)).toEqual({ scale: 1.5, x: 0, y: 0 })
    expect(toggleZoom({ scale: 2, x: 10, y: 0 }, 3)).toBe(unzoomed)
    expect(isZoomed(unzoomed)).toBe(false)
  })

  it("zooms around a point and resets at scale 1", () => {
    const zoomed = zoomAt(unzoomed, 0.2, 3, size, { x: 100, y: 0 })
    expect(zoomed.scale).toBe(1.2)
    expect(zoomed.x).toBeCloseTo(-20)
    expect(zoomed.y).toBeCloseTo(0)
    expect(zoomAt({ scale: 1.2, x: 0, y: 0 }, -0.4, 3, size, { x: 0, y: 0 })).toBe(unzoomed)
    expect(zoomAt({ scale: 3, x: 0, y: 0 }, 1, 3, size, { x: 0, y: 0 }).scale).toBe(3)
  })

  it("keeps the pan inside the zoomed image", () => {
    expect(clampPan({ scale: 2, x: 500, y: -500 }, size)).toEqual({ scale: 2, x: 200, y: -100 })
    expect(panBy({ scale: 2, x: 0, y: 0 }, 50, -30, size)).toEqual({ scale: 2, x: 50, y: -30 })
    expect(zoomTransform({ scale: 2, x: 50, y: -30 })).toBe("scale(2) translate(25px, -15px)")
  })
})
