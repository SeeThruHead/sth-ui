export const continues = (line: string): boolean => /^\s/.test(line) || /^[})\]|&]/.test(line)

export const blockAt = (lines: ReadonlyArray<string>, start: number): ReadonlyArray<string> => {
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => line !== "" && !continues(line))
  const block = lines.slice(start, start + 1 + (end === -1 ? rest.length : end))
  const last = block.findLastIndex((line) => line.trim() !== "")

  return block.slice(0, last + 1)
}
