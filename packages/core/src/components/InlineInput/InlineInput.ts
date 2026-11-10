import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import type { ElementAttribute, GetStyles } from "../../styles/StylesApi.ts"
import { colors, fontSize, space } from "../../theme/tokens.stylex.ts"
import { isShown } from "../Input/Input.ts"

export type InlineInputPart = "root" | "body" | "labelWrapper" | "label" | "description" | "error"

export type InlineInputSize = "xs" | "sm" | "md" | "lg" | "xl"

export type LabelPosition = "left" | "right"

export type InlineInputParts<M> = {
  readonly id: string
  readonly size: InlineInputSize
  readonly labelPosition: LabelPosition
  readonly label?: Child
  readonly description?: Child
  readonly error?: boolean | Child
  readonly disabled: boolean
  readonly rootAttributes: ReadonlyArray<ElementAttribute<M>>
  readonly labelAttributes: ReadonlyArray<ElementAttribute<M>>
  readonly control: Html
}

export const descriptionIdOf = (id: string) => `${id}-description`

export const errorIdOf = (id: string) => `${id}-error`

export const hasMessage = (value: boolean | Child | undefined): value is Child => isShown(value) && value !== true

export const inlineInputSizes = stylex.create({
  xs: { fontSize: fontSize.xs, lineHeight: "16px" },
  sm: { fontSize: fontSize.sm, lineHeight: "20px" },
  md: { fontSize: fontSize.md, lineHeight: "24px" },
  lg: { fontSize: fontSize.lg, lineHeight: "30px" },
  xl: { fontSize: fontSize.xl, lineHeight: "36px" }
})

const noteSizes = stylex.create({
  xs: { fontSize: `calc(${fontSize.xs} - 2px)` },
  sm: { fontSize: `calc(${fontSize.sm} - 2px)` },
  md: { fontSize: `calc(${fontSize.md} - 2px)` },
  lg: { fontSize: `calc(${fontSize.lg} - 2px)` },
  xl: { fontSize: `calc(${fontSize.xl} - 2px)` }
})

const offsets = stylex.create({
  left: { order: 1, paddingInlineStart: 0, paddingInlineEnd: space.sm },
  right: { order: 2, paddingInlineStart: space.sm, paddingInlineEnd: 0 }
})

const styles = stylex.create({
  body: { WebkitTapHighlightColor: "transparent", display: "flex" },
  labelWrapper: {
    WebkitTapHighlightColor: "transparent",
    display: "inline-flex",
    flexDirection: "column",
    cursor: "pointer"
  },
  disabledWrapper: { cursor: "not-allowed" },
  label: { cursor: "inherit", color: "inherit" },
  disabledLabel: { color: colors.disabledColor },
  note: {
    marginTop: `calc(${space.xs} / 2)`,
    overflowWrap: "break-word",
    lineHeight: 1.2,
    display: "block",
    cursor: "default"
  },
  description: { color: colors.dimmed },
  error: { color: colors.error }
})

export const inlineInput = <M, Part extends InlineInputPart>(
  h: HtmlBuilder<M>,
  getStyles: GetStyles<M, Part | InlineInputPart>,
  parts: InlineInputParts<M>
): Html => {
  const disabled = parts.disabled
  const offset = offsets[parts.labelPosition]
  const note = (kind: "description" | "error", id: string, content: Child) =>
    h.div([...getStyles(kind, styles.note, noteSizes[parts.size], styles[kind]), h.Id(id)], [content])

  return h.div(
    [
      h.DataAttribute("label-position", parts.labelPosition),
      h.DataAttribute("size", parts.size),
      ...parts.rootAttributes
    ],
    [
      h.div(getStyles("body", styles.body), [
        parts.control,
        h.div(
          [
            ...getStyles("labelWrapper", styles.labelWrapper, offset, disabled && styles.disabledWrapper),
            ...(disabled ? [h.DataAttribute("disabled", "")] : [])
          ],
          [
            ...(parts.label === undefined
              ? []
              : [
                  h.label(
                    [
                      ...getStyles("label", styles.label, disabled && styles.disabledLabel),
                      ...(disabled ? [h.DataAttribute("disabled", "")] : []),
                      ...parts.labelAttributes
                    ],
                    [parts.label]
                  )
                ]),
            ...(parts.description === undefined
              ? []
              : [note("description", descriptionIdOf(parts.id), parts.description)]),
            ...(hasMessage(parts.error) ? [note("error", errorIdOf(parts.id), parts.error)] : [])
          ]
        )
      ])
    ]
  )
}
