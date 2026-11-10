export type Spoke = { readonly x: number; readonly y: number; readonly angle: number }

export const radarSize = 300

export const radarCentre = radarSize / 2

export const radarRadius = radarSize * 0.4

const radian = Math.PI / 180

export const axisAngle = (index: number, count: number): number => 90 - (index * 360) / count

export const spokeAt = (index: number, count: number, radius: number): Spoke => {
  const angle = axisAngle(index, count)

  return {
    angle,
    x: Math.round((radarCentre + Math.cos(-radian * angle) * radius) * 1000) / 1000,
    y: Math.round((radarCentre + Math.sin(-radian * angle) * radius) * 1000) / 1000
  }
}

export const polygon = (radii: ReadonlyArray<number>): string =>
  `${radii
    .map((radius, index) => {
      const spoke = spokeAt(index, radii.length, radius)

      return `${index === 0 ? "M" : "L"}${spoke.x},${spoke.y}`
    })
    .join("")}Z`

export const anchorOf = (spoke: Spoke): "start" | "middle" | "end" => {
  const cos = Math.cos(radian * spoke.angle)
  if (Math.abs(cos) < 1e-6) return "middle"

  return cos > 0 ? "start" : "end"
}

export const nearestAxis = (x: number, y: number, count: number): number => {
  const angle = (Math.atan2(radarCentre - y, x - radarCentre) * 180) / Math.PI
  const step = 360 / count

  return ((Math.round((90 - angle) / step) % count) + count) % count
}
