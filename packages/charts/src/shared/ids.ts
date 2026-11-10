export const hashOf = (text: string): string =>
  Math.abs(
    Array.from(text, (character) => character.charCodeAt(0)).reduce((hash, code) => (hash * 31 + code) | 0, 7)
  ).toString(36)
