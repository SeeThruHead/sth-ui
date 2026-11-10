export type HighlightChunk = { readonly chunk: string; readonly highlighted: boolean }

export type HighlighterOptions = {
  readonly wholeWord?: boolean
  readonly caseInsensitive?: boolean
  readonly accentInsensitive?: boolean
}

const escapeRegex = (value: string): string => value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&")

export const foldAccents = (text: string): string => text.normalize("NFD").replace(/\p{M}/gu, "")

const nonEmpty = (chunks: ReadonlyArray<HighlightChunk>): ReadonlyArray<HighlightChunk> =>
  chunks.filter(({ chunk }) => chunk !== "")

const accentInsensitiveChunks = (value: string, pattern: RegExp): ReadonlyArray<HighlightChunk> => {
  const characters = Array.from(value.matchAll(/[\s\S]/gu))
  const folded = characters.map((character) => foldAccents(character[0])).join("")
  const offsets = [
    ...characters.flatMap((character) =>
      Array.from({ length: foldAccents(character[0]).length }, () => character.index)
    ),
    value.length
  ]
  const at = (index: number): number => Number(offsets[index])
  const walked = Array.from(folded.matchAll(pattern)).reduce<{
    readonly chunks: ReadonlyArray<HighlightChunk>
    readonly last: number
  }>(
    (state, match) => {
      const start = at(match.index)
      const end = at(match.index + match[0].length)

      return {
        chunks: [
          ...state.chunks,
          { chunk: value.slice(state.last, start), highlighted: false },
          { chunk: value.slice(start, end), highlighted: true }
        ],
        last: end
      }
    },
    { chunks: [], last: 0 }
  )

  return nonEmpty([...walked.chunks, { chunk: value.slice(walked.last), highlighted: false }])
}

export const highlighter = (
  value: string,
  highlight: string | ReadonlyArray<string>,
  options: HighlighterOptions = {}
): ReadonlyArray<HighlightChunk> => {
  const accentInsensitive = options.accentInsensitive !== false
  const terms = (typeof highlight === "string" ? [highlight] : highlight)
    .map((term) => (accentInsensitive ? foldAccents(escapeRegex(term)) : escapeRegex(term)).trim())
    .filter((term) => term !== "")
  if (terms.length === 0) return [{ chunk: value, highlighted: false }]
  const matcher = terms.toSorted((a, b) => b.length - a.length).join("|")
  const wholeWord = options.wholeWord === true
  const source = wholeWord ? `(?<![\\p{L}\\p{N}_])(${matcher})(?![\\p{L}\\p{N}_])` : `(${matcher})`
  const flags = ["g", options.caseInsensitive === false ? "" : "i", wholeWord ? "u" : ""].join("")
  const pattern = new RegExp(source, flags)
  if (accentInsensitive) return accentInsensitiveChunks(value, pattern)

  return nonEmpty(value.split(pattern).map((chunk, index) => ({ chunk, highlighted: index % 2 === 1 })))
}
