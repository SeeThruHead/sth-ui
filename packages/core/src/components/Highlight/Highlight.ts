import type { Html, HtmlBuilder } from "foldkit/html"
import { Struct } from "effect"
import { withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, Sx } from "../../styles/StylesApi.ts"
import { Mark } from "../Mark/Mark.ts"
import type { MarkConfig } from "../Mark/Mark.ts"
import { Text } from "../Text/Text.ts"
import type { TextConfig, TextOptions, TextPart, TextProps } from "../Text/Text.ts"
import { foldAccents, highlighter } from "./highlighter.ts"

export { foldAccents, highlighter } from "./highlighter.ts"
export type { HighlightChunk, HighlighterOptions } from "./highlighter.ts"

export type HighlightTerm = { readonly text: string; readonly color?: string }

export type HighlightOptions = Omit<TextOptions, "c"> & {
  readonly color?: string
  readonly wholeWord?: boolean
  readonly caseInsensitive?: boolean
  readonly accentInsensitive?: boolean
}

export type HighlightProps = Omit<TextProps, "children" | keyof TextOptions> &
  HighlightOptions & {
    readonly highlight: string | ReadonlyArray<string> | ReadonlyArray<HighlightTerm>
    readonly highlightStyles?: ReadonlyArray<Sx>
    readonly children: string
  }

export type HighlightConfig = ComponentConfig<HighlightOptions, TextPart>

const isTerm = (term: string | HighlightTerm): term is HighlightTerm => typeof term !== "string"

const termsOf = (highlight: HighlightProps["highlight"]): ReadonlyArray<string | HighlightTerm> =>
  typeof highlight === "string" ? [highlight] : highlight

const ownKeys = [
  "highlight",
  "highlightStyles",
  "children",
  "color",
  "wholeWord",
  "caseInsensitive",
  "accentInsensitive"
] as const

export const Highlight = (config: {
  readonly Highlight?: HighlightConfig
  readonly Text?: TextConfig
  readonly Mark?: MarkConfig
}) => {
  const text = Text({ Text: { ...config.Text, ...config.Highlight } })
  const mark = Mark(config)

  return <M>(h: HtmlBuilder<M>, input: HighlightProps): Html => {
    const props = withDefaults(config.Highlight, input)
    const normalize = (value: string): string => {
      const cased = props.caseInsensitive === false ? value : value.toLowerCase()

      return props.accentInsensitive === false ? cased : foldAccents(cased)
    }
    const terms = termsOf(props.highlight)
    const colors = new Map(
      terms
        .filter(isTerm)
        .flatMap((term) => (term.color === undefined ? [] : [[normalize(term.text), term.color] as const]))
    )
    const chunks = highlighter(
      props.children,
      terms.map((term) => (isTerm(term) ? term.text : term)),
      Struct.pick(props, ["wholeWord", "caseInsensitive", "accentInsensitive"])
    )

    return text(h, {
      ...Struct.omit(props, ownKeys),
      children: chunks.map(({ chunk, highlighted }) =>
        highlighted
          ? mark(h, {
              color: colors.get(normalize(chunk)) ?? props.color ?? "yellow",
              ...(props.highlightStyles === undefined ? {} : { styles: { root: props.highlightStyles } }),
              attributes: { root: { "data-highlight": chunk } },
              children: [chunk]
            })
          : h.span([], [chunk])
      )
    })
  }
}
