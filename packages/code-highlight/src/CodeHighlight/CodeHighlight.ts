import * as stylex from "@stylexjs/stylex"
import { Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "@sth-ui/core/content.ts"
import { unstyledButtonStyles } from "@sth-ui/core/components/UnstyledButton/UnstyledButton.ts"
import { radiusValue } from "@sth-ui/core/styles/styleProps.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { colors, font, fontSize, radius, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { normalizeCode, plainTextHighlighter } from "../highlighter.ts"
import type { Highlighter } from "../highlighter.ts"
import { codeHighlightVars as vars } from "./codeHighlight.stylex.ts"
import { Message } from "./model.ts"
import type { Model } from "./model.ts"

export type CodeHighlightPart =
  | "codeHighlight"
  | "pre"
  | "code"
  | "controls"
  | "control"
  | "codeWrapper"
  | "lineNumbers"
  | "scrollarea"
  | "showCodeButton"

export type CodeHighlightOptions = {
  readonly copyLabel?: string
  readonly copiedLabel?: string
  readonly maxCollapsedHeight?: number | string
  readonly withCopyButton?: boolean
  readonly withExpandButton?: boolean
  readonly expandCodeLabel?: string
  readonly collapseCodeLabel?: string
  readonly background?: string
  readonly radius?: StyleValue
  readonly withBorder?: boolean
  readonly withLineNumbers?: boolean
  readonly codeColorScheme?: string
  readonly withFirstLineIndentation?: boolean
  readonly highlighter?: Highlighter
}

export type CodeHighlightProps<M> = CodeHighlightOptions &
  StylesApiProps<CodeHighlightPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly code: string
    readonly language?: string
    readonly controls?: ReadonlyArray<Child>
    readonly withOffset?: boolean
  }

export type CodeHighlightConfig = ComponentConfig<CodeHighlightOptions, CodeHighlightPart>

const light = `light-dark(${palette.gray0}, ${palette.dark8})`

export const codeStyles = stylex.create({
  codeHighlight: {
    position: "relative",
    borderRadius: vars.radius,
    overflow: "hidden",
    [vars.background]: light
  },
  darkScheme: { [vars.background]: palette.dark8 },
  lightScheme: { [vars.background]: palette.gray0 },
  border: { borderWidth: "1px", borderStyle: "solid", borderColor: `light-dark(${palette.gray2}, ${palette.dark6})` },
  borderDark: { borderColor: palette.dark6 },
  borderLight: { borderColor: palette.gray2 },
  pre: { display: "block", margin: 0, flexGrow: 1, minWidth: 0 },
  code: {
    display: "block",
    paddingBlock: space.xs,
    paddingInline: space.md,
    backgroundColor: vars.background,
    fontSize: "13px",
    lineHeight: 1.7,
    fontFamily: font.mono,
    width: "fit-content",
    minWidth: "100%",
    boxSizing: "border-box"
  },
  offset: { paddingTop: "50px" },
  controls: {
    position: "absolute",
    top: "8px",
    right: "8px",
    zIndex: 1,
    display: "flex",
    backgroundColor: vars.background,
    borderBottomLeftRadius: radius.md
  },
  controlsOffset: { top: "12px" },
  control: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: radius.default,
    color: { default: colors.text, ":hover": colors.bright },
    opacity: { default: 0.5, ":hover": 1 }
  },
  controlDark: { color: { default: palette.dark0, ":hover": palette.white } },
  controlLight: { color: { default: palette.black, ":hover": palette.black } },
  controlIcon: { width: "18px", height: "18px", display: "block" },
  codeWrapper: { display: "flex", flexDirection: "row" },
  lineNumbers: {
    userSelect: "none",
    textAlign: "right",
    padding: space.xs,
    paddingLeft: space.md,
    fontFamily: font.mono,
    fontSize: "13px",
    lineHeight: 1.7,
    color: colors.dimmed,
    backgroundColor: vars.background,
    flexShrink: 0
  },
  scrollarea: { overflowX: "auto", scrollbarWidth: "thin", overscrollBehaviorInline: "none" },
  collapsed: {
    maxHeight: vars.maxHeight,
    overflow: "hidden",
    position: "relative",
    "::after": {
      content: "''",
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: "80px",
      pointerEvents: "none",
      backgroundImage: `linear-gradient(0deg, ${vars.background} 0%, ${vars.background} 25%, transparent 100%)`,
      zIndex: 1
    }
  },
  showCodeButton: {
    position: "absolute",
    zIndex: 2,
    bottom: 0,
    insetInlineStart: "50%",
    transform: "translateX(-50%)",
    fontSize: fontSize.sm,
    color: colors.anchor,
    width: "100%",
    textAlign: "center",
    paddingBlock: space.xs,
    whiteSpace: "nowrap"
  },
  hidden: { display: "none" },
  inline: {
    display: "inline-block",
    borderRadius: vars.radius,
    overflow: "hidden",
    backgroundColor: vars.background,
    fontSize: "13px",
    paddingBlock: "3px",
    paddingInline: "5px",
    fontFamily: font.mono,
    [vars.background]: light
  },
  inlineRadius: { [vars.radius]: radius.sm }
})

const copyPaths = [
  "M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z",
  "M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"
]

const copiedPaths = ["M5 12l5 5l10 -10"]

const collapsePaths = ["M12 13v-8l-3 3m6 0l-3 -3", "M9 17l1 0", "M14 17l1 0", "M19 17l1 0", "M4 17l1 0"]

const expandPaths = ["M12 11v8l3 -3m-6 0l3 3", "M9 7l1 0", "M14 7l1 0", "M19 7l1 0", "M4 7l1 0"]

export const schemeStyles = (scheme: string | undefined) => {
  if (scheme === "dark") return codeStyles.darkScheme
  if (scheme === "light") return codeStyles.lightScheme

  return null
}

const borderScheme = (scheme: string | undefined) => {
  if (scheme === "dark") return codeStyles.borderDark
  if (scheme === "light") return codeStyles.borderLight

  return null
}

const controlScheme = (scheme: string | undefined) => {
  if (scheme === "dark") return codeStyles.controlDark
  if (scheme === "light") return codeStyles.controlLight

  return null
}

export const highlightedContent = (
  props: {
    readonly code: string
    readonly language?: string
    readonly codeColorScheme?: string
    readonly withFirstLineIndentation?: boolean
    readonly highlighter?: Highlighter
  },
  fallback: Highlighter
) => {
  const code = normalizeCode(props.code, { withFirstLineIndentation: props.withFirstLineIndentation === true })
  const highlighted = (props.highlighter ?? fallback)({
    code,
    colorScheme: props.codeColorScheme ?? "light",
    ...(props.language === undefined ? {} : { language: props.language })
  })

  return {
    code,
    className: Option.fromNullishOr(highlighted.codeClassName),
    content: highlighted.isHighlighted
      ? { html: Option.some(highlighted.highlightedCode), text: [] }
      : { html: Option.none(), text: [code] }
  }
}

export const CodeHighlight =
  (config: { readonly CodeHighlight?: CodeHighlightConfig; readonly highlighter?: Highlighter }) =>
  <M>(h: HtmlBuilder<M>, input: CodeHighlightProps<M>): Html => {
    const props = withDefaults(config.CodeHighlight, input)
    const getStyles = stylesApi<M, CodeHighlightPart>(h, props, config.CodeHighlight, "codeHighlight")
    const send = props.toParentMessage
    const scheme = props.codeColorScheme
    const expanded = props.model.expanded
    const highlighted = highlightedContent(props, config.highlighter ?? plainTextHighlighter)
    const copied = Option.contains(props.model.copied, "code")
    const withCopy = props.withCopyButton !== false
    const withExpand = props.withExpandButton === true
    const extra = props.controls ?? []
    const offset = props.withOffset === true
    const copyLabel = props.copyLabel ?? "Copy"
    const copiedLabel = props.copiedLabel ?? "Copied"
    const expandLabel = props.expandCodeLabel ?? "Expand code"
    const collapseLabel = props.collapseCodeLabel ?? "Collapse code"
    const control = (label: string, title: string, message: Message, paths: ReadonlyArray<string>) =>
      h.button(
        [
          ...getStyles("control", unstyledButtonStyles.root, codeStyles.control, controlScheme(scheme)),
          h.Type("button"),
          h.AriaLabel(label),
          h.Title(title),
          ...(scheme === undefined ? [] : [h.DataAttribute("code-color-scheme", scheme)]),
          h.OnClick(send(message))
        ],
        [
          h.svg(
            [
              ...sx(h, codeStyles.controlIcon),
              h.Attribute("viewBox", "0 0 24 24"),
              h.Attribute("stroke-width", "2"),
              h.Attribute("stroke", "currentColor"),
              h.Attribute("fill", "none"),
              h.Attribute("stroke-linecap", "round"),
              h.Attribute("stroke-linejoin", "round"),
              h.AriaHidden(true)
            ],
            paths.map((d) => h.path([h.Attribute("d", d)], []))
          )
        ]
      )
    const controls =
      extra.length > 0 || withExpand || withCopy
        ? [
            h.div(
              [
                ...getStyles("controls", codeStyles.controls, offset && codeStyles.controlsOffset),
                ...(offset ? [h.DataAttribute("with-offset", "")] : [])
              ],
              [
                ...extra,
                ...(withExpand
                  ? [
                      control(
                        expanded ? collapseLabel : expandLabel,
                        expanded ? collapseLabel : expandLabel,
                        Message.ToggledExpanded(),
                        expanded ? collapsePaths : expandPaths
                      )
                    ]
                  : []),
                ...(withCopy
                  ? [
                      control(
                        copied ? copiedLabel : `${copyLabel} code`,
                        copied ? copiedLabel : copyLabel,
                        Message.Copied({ target: "code", text: highlighted.code, timeout: 2000 }),
                        copied ? copiedPaths : copyPaths
                      )
                    ]
                  : [])
              ]
            )
          ]
        : []

    return h.div(
      [
        ...getStyles(
          "codeHighlight",
          codeStyles.codeHighlight,
          schemeStyles(scheme),
          props.withBorder === true && codeStyles.border,
          props.withBorder === true && borderScheme(scheme),
          setDefinedVars(
            [vars.background, props.background],
            [vars.radius, mapDefined(props.radius, radiusValue)],
            [
              vars.maxHeight,
              mapDefined(props.maxCollapsedHeight, (height) =>
                typeof height === "number" ? `${height / 16}rem` : height
              )
            ]
          )
        ),
        h.Attribute("dir", "ltr"),
        ...(scheme === undefined ? [] : [h.DataAttribute("code-color-scheme", scheme)]),
        ...(props.withBorder === true ? [h.DataAttribute("with-border", "")] : [])
      ],
      [
        ...controls,
        h.div(
          [
            ...getStyles("scrollarea", codeStyles.scrollarea, !expanded && codeStyles.collapsed),
            ...(expanded ? [] : [h.DataAttribute("collapsed", "")])
          ],
          [
            h.div(getStyles("codeWrapper", codeStyles.codeWrapper), [
              ...(props.withLineNumbers === true
                ? [
                    h.div(
                      [
                        ...getStyles("lineNumbers", codeStyles.lineNumbers, offset && codeStyles.offset),
                        h.AriaHidden(true),
                        ...(offset ? [h.DataAttribute("with-offset", "")] : [])
                      ],
                      highlighted.code.split("\n").map((_line, index) => h.div([], [String(index + 1)]))
                    )
                  ]
                : []),
              h.pre(
                [...getStyles("pre", codeStyles.pre), ...(offset ? [h.DataAttribute("with-offset", "")] : [])],
                [
                  h.code(
                    [
                      ...getStyles("code", codeStyles.code, offset && codeStyles.offset),
                      ...Option.match(highlighted.className, { onNone: () => [], onSome: (name) => [h.Class(name)] }),
                      ...Option.match(highlighted.content.html, {
                        onNone: () => [],
                        onSome: (html) => [h.InnerHTML(html)]
                      })
                    ],
                    highlighted.content.text
                  )
                ]
              )
            ])
          ]
        ),
        h.button(
          [
            ...getStyles(
              "showCodeButton",
              unstyledButtonStyles.root,
              codeStyles.showCodeButton,
              expanded && codeStyles.hidden
            ),
            h.Type("button"),
            ...(expanded ? [h.DataAttribute("hidden", "")] : []),
            ...(scheme === undefined ? [] : [h.DataAttribute("code-color-scheme", scheme)]),
            h.OnClick(send(Message.ShowedCode()))
          ],
          [expandLabel]
        )
      ]
    )
  }
