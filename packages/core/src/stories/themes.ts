import * as stylex from "@stylexjs/stylex"
import type { CompiledStyles } from "@stylexjs/stylex"
import type { AccentName } from "../theme/accents.ts"
import { font, radius } from "../theme/tokens.stylex.ts"
import type { UiConfig } from "../Ui.ts"

const grapeRadius = stylex.createTheme(radius, { default: "2rem" })

const grapeFont = stylex.createTheme(font, { body: "Georgia, serif" })

const compactRadius = stylex.createTheme(radius, { default: "0.125rem" })

export type StoryTheme = {
  readonly primaryColor?: AccentName
  readonly themes: ReadonlyArray<CompiledStyles>
  readonly config: UiConfig
}

export const themes: { readonly [name: string]: StoryTheme } = {
  Mantine: { themes: [], config: {} },
  Grape: {
    primaryColor: "grape",
    themes: [grapeRadius, grapeFont],
    config: { components: { Button: { defaultProps: { variant: "light" } } } }
  },
  Compact: {
    primaryColor: "teal",
    themes: [compactRadius],
    config: { components: { Button: { defaultProps: { size: "xs" } } } }
  }
}
