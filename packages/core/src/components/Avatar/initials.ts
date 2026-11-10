export const defaultInitialsColors: ReadonlyArray<string> = [
  "blue",
  "cyan",
  "grape",
  "green",
  "indigo",
  "lime",
  "orange",
  "pink",
  "red",
  "teal",
  "violet"
]

export const getInitials = (name: string, limit = 2): string => {
  const words = name.split(" ")
  if (words.length === 1) return name.slice(0, limit).toUpperCase()

  return words
    .map((word) => word.slice(0, 1))
    .slice(0, limit)
    .join("")
    .toUpperCase()
}

const hashCode = (input: string): number =>
  Array.from({ length: input.length }, (_, index) => input.charCodeAt(index)).reduce(
    (hash, code) => ((hash << 5) - hash + code) | 0,
    0
  )

export const getInitialsColor = (name: string, colors: ReadonlyArray<string> = defaultInitialsColors): string =>
  colors[Math.abs(hashCode(name)) % colors.length] ?? "gray"
