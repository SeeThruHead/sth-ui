import type { Html, HtmlBuilder } from "foldkit/html"
import { radiusValue } from "@sth-ui/core/styles/styleProps.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { Option } from "effect"
import { plainTextHighlighter } from "../highlighter.ts"
import type { Highlighter } from "../highlighter.ts"
import { codeHighlightVars as vars } from "./codeHighlight.stylex.ts"
import { codeStyles, highlightedContent, schemeStyles } from "./CodeHighlight.ts"

export type InlineCodeHighlightPart = "inlineCodeHighlight"

export type InlineCodeHighlightOptions = {
  readonly background?: string
  readonly radius?: StyleValue
  readonly withBorder?: boolean
  readonly withFirstLineIndentation?: boolean
  readonly codeColorScheme?: string
  readonly highlighter?: Highlighter
}

export type InlineCodeHighlightProps = InlineCodeHighlightOptions &
  StylesApiProps<InlineCodeHighlightPart> & { readonly code: string; readonly language?: string }

export type InlineCodeHighlightConfig = ComponentConfig<InlineCodeHighlightOptions, InlineCodeHighlightPart>

export const InlineCodeHighlight =
  (config: { readonly InlineCodeHighlight?: InlineCodeHighlightConfig; readonly highlighter?: Highlighter }) =>
  <M>(h: HtmlBuilder<M>, input: InlineCodeHighlightProps): Html => {
    const props = withDefaults(config.InlineCodeHighlight, input)
    const getStyles = stylesApi<M, InlineCodeHighlightPart>(h, props, config.InlineCodeHighlight, "inlineCodeHighlight")
    const highlighted = highlightedContent(props, config.highlighter ?? plainTextHighlighter)

    return h.code(
      [
        ...getStyles(
          "inlineCodeHighlight",
          codeStyles.inline,
          codeStyles.inlineRadius,
          schemeStyles(props.codeColorScheme),
          props.withBorder === true && codeStyles.border,
          setDefinedVars([vars.background, props.background], [vars.radius, mapDefined(props.radius, radiusValue)])
        ),
        ...Option.match(highlighted.className, { onNone: () => [], onSome: (name) => [h.Class(name)] }),
        ...(props.codeColorScheme === undefined ? [] : [h.DataAttribute("code-color-scheme", props.codeColorScheme)]),
        ...(props.withBorder === true ? [h.DataAttribute("with-border", "")] : []),
        ...Option.match(highlighted.content.html, { onNone: () => [], onSome: (html) => [h.InnerHTML(html)] })
      ],
      highlighted.content.text
    )
  }
