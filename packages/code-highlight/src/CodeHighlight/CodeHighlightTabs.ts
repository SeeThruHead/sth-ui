import { Array as Arr } from "effect"
import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "@sth-ui/core/content.ts"
import { unstyledButtonStyles } from "@sth-ui/core/components/UnstyledButton/UnstyledButton.ts"
import { stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { font, fontSize, fontWeight, radius, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import type { Highlighter } from "../highlighter.ts"
import { CodeHighlight } from "./CodeHighlight.ts"
import type {
  CodeHighlightConfig,
  CodeHighlightOptions,
  CodeHighlightPart,
  CodeHighlightProps
} from "./CodeHighlight.ts"
import { Message } from "./model.ts"

export type CodeHighlightTabsCode = {
  readonly language?: string
  readonly code: string
  readonly fileName?: string
  readonly icon?: Child
}

export type CodeHighlightTabsPart = "root" | "files" | "file" | "fileIcon" | "filesScrollarea" | CodeHighlightPart

export type CodeHighlightTabsProps<M> = Omit<
  CodeHighlightProps<M>,
  "code" | "language" | "withOffset" | "styles" | "classNames" | "unstyled"
> &
  StylesApiProps<CodeHighlightTabsPart> & {
    readonly code: ReadonlyArray<CodeHighlightTabsCode>
    readonly getFileIcon?: (fileName: string) => Child
  }

export type CodeHighlightTabsConfig = ComponentConfig<CodeHighlightOptions, CodeHighlightTabsPart>

const styles = stylex.create({
  root: { position: "relative" },
  filesScrollarea: {
    position: "absolute",
    zIndex: 2,
    top: 0,
    left: 0,
    right: "70px",
    overflowX: "auto",
    scrollbarWidth: "none"
  },
  files: { display: "flex", paddingTop: "12px", paddingInline: "10px", gap: space.xs },
  file: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: fontSize.xs,
    gap: "7px",
    paddingBlock: "5px",
    paddingInline: "9px",
    fontFamily: font.mono,
    fontWeight: fontWeight.bold,
    lineHeight: 1,
    userSelect: "none",
    cursor: { default: "pointer", ":only-child": "default" },
    opacity: { default: 0.8, ":hover": 1 },
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray3}, ${palette.dark4})`,
    color: `light-dark(${palette.gray8}, ${palette.dark0})`,
    whiteSpace: "nowrap",
    margin: 0,
    borderRadius: radius.default
  },
  active: {
    opacity: 1,
    backgroundColor: `light-dark(${palette.white}, ${palette.dark5})`,
    color: `light-dark(${palette.black}, ${palette.white})`
  },
  darkFile: { borderColor: palette.dark4, color: palette.dark0 },
  darkActive: { backgroundColor: palette.dark5, color: palette.white },
  lightFile: { borderColor: palette.gray3, color: palette.gray8 },
  lightActive: { backgroundColor: palette.white, color: palette.black },
  fileIcon: { display: "inline-flex" }
})

const schemeFile = (scheme: string | undefined, active: boolean) => {
  if (scheme === "dark") return [styles.darkFile, active && styles.darkActive]
  if (scheme === "light") return [styles.lightFile, active && styles.lightActive]

  return []
}

export const CodeHighlightTabs =
  (config: {
    readonly CodeHighlightTabs?: CodeHighlightTabsConfig
    readonly CodeHighlight?: CodeHighlightConfig
    readonly highlighter?: Highlighter
  }) =>
  <M>(h: HtmlBuilder<M>, input: CodeHighlightTabsProps<M>): Html => {
    const props = withDefaults(config.CodeHighlightTabs, input)
    const getStyles = stylesApi<M, CodeHighlightTabsPart>(h, props, config.CodeHighlightTabs, "root")
    const send = props.toParentMessage
    if (props.code.length === 0) return h.div([], [])
    const active = Math.min(props.model.activeTab, props.code.length - 1)
    const current = Arr.getUnsafe(props.code, active)
    const icon = (file: CodeHighlightTabsCode) => {
      const shown =
        file.icon ??
        (file.fileName !== undefined && props.getFileIcon !== undefined ? props.getFileIcon(file.fileName) : undefined)

      return shown === undefined ? [] : [h.span(getStyles("fileIcon", styles.fileIcon), [shown])]
    }
    const { code: _code, getFileIcon: _getFileIcon, styles: partStyles, ...settings } = props

    return h.div(getStyles("root", styles.root), [
      h.div(getStyles("filesScrollarea", styles.filesScrollarea), [
        h.div(
          [...getStyles("files", styles.files), h.Role("tablist")],
          props.code.map((file, index) =>
            h.button(
              [
                ...getStyles(
                  "file",
                  unstyledButtonStyles.root,
                  styles.file,
                  index === active && styles.active,
                  ...schemeFile(props.codeColorScheme, index === active)
                ),
                h.Type("button"),
                h.Role("tab"),
                h.AriaSelected(index === active),
                ...(index === active ? [h.DataAttribute("active", "")] : []),
                ...(props.codeColorScheme === undefined
                  ? []
                  : [h.DataAttribute("color-scheme", props.codeColorScheme)]),
                h.OnClick(send(Message.ChoseTab({ index })))
              ],
              [...icon(file), h.span([], [file.fileName ?? ""])]
            )
          )
        )
      ]),
      CodeHighlight(config)(h, {
        ...settings,
        ...(partStyles === undefined ? {} : { styles: partStyles }),
        code: current.code,
        ...(current.language === undefined ? {} : { language: current.language }),
        withOffset: true
      })
    ])
  }
