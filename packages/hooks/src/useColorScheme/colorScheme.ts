import { Stream } from "effect"
import { mediaQueryMatches } from "../useMediaQuery/mediaQuery.ts"
import type { MediaQuerySource } from "../useMediaQuery/mediaQuery.ts"

export type ColorScheme = "dark" | "light"

export const darkQuery = "(prefers-color-scheme: dark)"

export const colorSchemeChanges = (list: MediaQuerySource): Stream.Stream<ColorScheme> =>
  mediaQueryMatches(list).pipe(Stream.map((dark): ColorScheme => (dark ? "dark" : "light")))
