import * as stylex from "@stylexjs/stylex"
import { accent, shadow } from "../../theme/tokens.stylex.ts"

export const tourVars = stylex.defineVars({
  zIndex: "10000",
  overlayColor: "rgba(0, 0, 0, 0.5)",
  color: accent.filled,
  tooltipShadow: shadow.md,
  maxWidth: "360px",
  beaconSize: "12px"
})
