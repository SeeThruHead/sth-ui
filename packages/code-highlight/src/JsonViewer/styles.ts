import * as stylex from "@stylexjs/stylex"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, font, fontSize, radius, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { jsonViewerVars as vars } from "./jsonViewer.stylex.ts"

export const styles = stylex.create({
  root: {
    position: "relative",
    direction: "ltr",
    fontFamily: font.mono,
    fontSize: vars.fontSize,
    lineHeight: 1.55,
    borderRadius: vars.radius,
    backgroundColor: `light-dark(${palette.gray0}, ${palette.dark8})`
  },
  bordered: { borderWidth: "1px", borderStyle: "solid", borderColor: `light-dark(${palette.gray3}, ${palette.dark4})` },
  controls: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.xs,
    paddingBlock: space.xs,
    paddingInline: space.sm,
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: `light-dark(${palette.gray3}, ${palette.dark4})`
  },
  controlsBesideCopy: { paddingRight: `calc(44px + ${space.xs})` },
  control: {
    fontSize: fontSize.xs,
    whiteSpace: "nowrap",
    paddingBlock: "2px",
    paddingInline: "8px",
    borderRadius: radius.sm,
    backgroundColor: {
      default: `light-dark(${palette.gray1}, ${palette.dark6})`,
      ":hover": `light-dark(${palette.gray2}, ${palette.dark5})`
    },
    color: `light-dark(${palette.gray7}, ${palette.dark1})`
  },
  scrollarea: { overflowX: "auto", scrollbarWidth: "thin" },
  wrapper: { display: "flex", alignItems: "stretch" },
  content: {
    paddingBlock: space.xs,
    paddingInline: space.sm,
    overflow: "hidden",
    flexGrow: 1,
    minWidth: "min-content"
  },
  lineNumbers: {
    display: "flex",
    flexDirection: "column",
    userSelect: "none",
    textAlign: "right",
    padding: space.xs,
    paddingLeft: space.sm,
    marginRight: space.xs,
    borderRightWidth: "1px",
    borderRightStyle: "solid",
    borderRightColor: `light-dark(${palette.gray3}, ${palette.dark4})`,
    boxSizing: "content-box",
    minWidth: "2ch",
    color: `light-dark(${palette.gray7}, ${palette.dark2})`
  },
  node: { position: "relative" },
  row: {
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    minHeight: "24px",
    paddingBlock: "1px",
    paddingInline: "4px",
    borderRadius: radius.sm,
    width: "100%",
    boxSizing: "border-box",
    textAlign: "left",
    fontFamily: "inherit",
    fontSize: "inherit",
    lineHeight: "inherit",
    position: "relative",
    outline: { default: null, ":focus-visible": `2px solid ${accent.filled}` },
    outlineOffset: { default: null, ":focus-visible": "-2px" }
  },
  hoverable: {
    cursor: "default",
    backgroundColor: { default: null, ":hover": `light-dark(${palette.gray1}, ${palette.dark6})` }
  },
  added: { backgroundColor: `light-dark(${palette.green1}, rgba(64, 192, 87, 0.15))` },
  removed: { backgroundColor: `light-dark(${palette.red1}, rgba(250, 82, 82, 0.15))` },
  toggle: {
    position: "absolute",
    left: `calc(${space.sm} * -1 - 4px)`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "24px",
    flexShrink: 0,
    cursor: "pointer",
    color: `light-dark(${palette.gray6}, ${palette.dark3})`
  },
  toggleExpanded: { transform: "rotate(90deg)" },
  key: { color: `light-dark(${palette.violet7}, ${palette.violet4})`, whiteSpace: "nowrap", lineHeight: 1.55 },
  value: { whiteSpace: "pre", lineHeight: 1.55 },
  wrap: { minWidth: "20ch", whiteSpace: "pre-wrap", overflowWrap: "anywhere" },
  string: { color: `light-dark(${palette.teal8}, ${palette.teal4})` },
  number: { color: `light-dark(${palette.blue7}, ${palette.blue4})` },
  boolean: { color: `light-dark(${palette.orange7}, ${palette.orange4})` },
  empty: { color: `light-dark(${palette.red7}, ${palette.red4})` },
  circular: { fontStyle: "italic", color: `light-dark(${palette.gray7}, ${palette.dark2})` },
  bracket: { color: `light-dark(${palette.gray7}, ${palette.dark2})` },
  type: {
    fontSize: `calc(${vars.fontSize} * 0.85)`,
    paddingBlock: 0,
    paddingInline: "4px",
    borderRadius: radius.xs,
    whiteSpace: "nowrap",
    flexShrink: 0,
    alignSelf: "center"
  },
  typeString: {
    backgroundColor: `light-dark(${palette.teal0}, rgba(18, 184, 134, 0.15))`,
    color: `light-dark(${palette.teal8}, ${palette.teal4})`
  },
  typeNumber: {
    backgroundColor: `light-dark(${palette.blue0}, rgba(34, 139, 230, 0.15))`,
    color: `light-dark(${palette.blue7}, ${palette.blue4})`
  },
  typeBoolean: {
    backgroundColor: `light-dark(${palette.orange0}, rgba(253, 126, 20, 0.15))`,
    color: `light-dark(${palette.orange7}, ${palette.orange4})`
  },
  typeEmpty: {
    backgroundColor: `light-dark(${palette.red0}, rgba(250, 82, 82, 0.15))`,
    color: `light-dark(${palette.red7}, ${palette.red4})`
  },
  typeCircular: {
    backgroundColor: `light-dark(${palette.gray1}, ${palette.dark6})`,
    color: `light-dark(${palette.gray7}, ${palette.dark2})`
  },
  typeArray: {
    backgroundColor: `light-dark(${palette.cyan0}, rgba(21, 170, 191, 0.15))`,
    color: `light-dark(${palette.cyan8}, ${palette.cyan4})`
  },
  typeObject: {
    backgroundColor: `light-dark(${palette.grape0}, rgba(190, 75, 219, 0.15))`,
    color: `light-dark(${palette.grape8}, ${palette.grape4})`
  },
  size: {
    fontSize: `calc(${vars.fontSize} * 0.85)`,
    whiteSpace: "nowrap",
    flexShrink: 0,
    alignSelf: "center",
    color: `light-dark(${palette.gray7}, ${palette.dark3})`
  },
  ellipsis: { color: `light-dark(${palette.gray7}, ${palette.dark3})` },
  clickable: {
    fontSize: `calc(${vars.fontSize} * 0.85)`,
    cursor: "pointer",
    textDecorationLine: "underline",
    textDecorationStyle: { default: "dotted", ":hover": "solid" },
    whiteSpace: "nowrap",
    flexShrink: 0
  },
  copyButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "20px",
    height: "20px",
    flexShrink: 0,
    cursor: "pointer",
    borderRadius: radius.sm,
    color: `light-dark(${palette.gray6}, ${palette.dark2})`,
    opacity: { default: 0, [stylex.when.ancestor(":is(:hover, :focus-within)")]: 1 },
    transitionProperty: "opacity",
    transitionDuration: "100ms"
  },
  copyAllButton: {
    position: "absolute",
    top: space.xs,
    right: space.xs,
    zIndex: 2,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: radius.sm,
    color: `light-dark(${palette.gray7}, ${palette.dark1})`,
    backgroundColor: { default: "transparent", ":hover": `light-dark(${palette.gray1}, ${palette.dark6})` }
  },
  group: { paddingLeft: vars.indent }
})

export const valueTones: Readonly<Record<string, stylex.StyleXStyles>> = {
  string: styles.string,
  number: styles.number,
  bigint: styles.number,
  boolean: styles.boolean,
  null: styles.empty,
  undefined: styles.empty,
  circular: styles.circular
}

export const typeTones: Readonly<Record<string, stylex.StyleXStyles>> = {
  string: styles.typeString,
  number: styles.typeNumber,
  bigint: styles.typeNumber,
  boolean: styles.typeBoolean,
  null: styles.typeEmpty,
  undefined: styles.typeEmpty,
  circular: styles.typeCircular,
  array: styles.typeArray,
  object: styles.typeObject
}
