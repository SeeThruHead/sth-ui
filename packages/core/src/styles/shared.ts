import * as stylex from "@stylexjs/stylex"
import { accent } from "../theme/tokens.stylex.ts"

export const shared = stylex.create({
  borderBox: { boxSizing: "border-box" },
  focusRing: {
    outlineStyle: { default: null, ":focus-visible": "solid" },
    outlineWidth: { default: null, ":focus-visible": "2px" },
    outlineColor: { default: null, ":focus-visible": accent.filled },
    outlineOffset: { default: null, ":focus-visible": "2px" }
  },
  active: { transform: { default: null, ":active": "translateY(0.0625rem)" } },
  visuallyHidden: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: 0
  }
})
