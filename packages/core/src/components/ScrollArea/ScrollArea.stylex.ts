import * as stylex from "@stylexjs/stylex"

export const scrollAreaVars = stylex.defineVars({
  scrollbarSize: "12px",
  offsetSize: "12px",
  overscroll: "auto",
  cornerWidth: "0px",
  cornerHeight: "0px",
  thumbSize: "100%",
  progress: "0"
})

export const scrollbarMarker = stylex.defineMarker()
