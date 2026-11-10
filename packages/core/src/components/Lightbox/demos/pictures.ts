const picture = (color: string, label: string, width = 800, height = 500) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" fill="white" font-family="sans-serif" font-size="48" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`
  )}`

export const pictures = [
  { src: picture("#228be6", "Mountains"), alt: "Mountains at dawn", caption: "Mountains at dawn" },
  { src: picture("#12b886", "Forest"), alt: "A quiet forest", caption: "A quiet forest" },
  { src: picture("#fd7e14", "Desert", 500, 800), alt: "Desert dunes", thumbSrc: picture("#fd7e14", "Dunes", 120, 120) }
]
