export type Ring = { readonly inner: number; readonly outer: number }

export const rings = (count: number, barSize: number, radius: number): ReadonlyArray<Ring> => {
  const start = radius * 0.1
  const band = (radius - start) / Math.max(count, 1)
  const thickness = Math.min(barSize, band * 0.8)

  return Array.from({ length: count }, (_, index) => {
    const middle = start + band * (index + 0.5)

    return { inner: middle - thickness / 2, outer: middle + thickness / 2 }
  })
}

export const sweep = (value: number, top: number, startAngle: number, endAngle: number): number =>
  startAngle + ((endAngle - startAngle) * Math.max(0, value)) / top
