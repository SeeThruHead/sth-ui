import * as stylex from "@stylexjs/stylex"
import type { CompiledStyles, StyleXStyles } from "@stylexjs/stylex"

export const stylexClass = (...styles: ReadonlyArray<CompiledStyles | StyleXStyles | null | undefined>): string =>
  stylex.props(...styles).className ?? ""
