import * as stylex from "@stylexjs/stylex"
import { simpleGridVars } from "./SimpleGrid.stylex.ts"

const breakpoints = {
  xs: "@media (min-width: 36em)",
  sm: "@media (min-width: 48em)",
  md: "@media (min-width: 62em)",
  lg: "@media (min-width: 75em)",
  xl: "@media (min-width: 88em)"
}

const containerRanges = {
  xs: "@container simple-grid (min-width: 36em) and (max-width: 47.99em)",
  sm: "@container simple-grid (min-width: 48em) and (max-width: 61.99em)",
  md: "@container simple-grid (min-width: 62em) and (max-width: 74.99em)",
  lg: "@container simple-grid (min-width: 75em) and (max-width: 87.99em)",
  xl: "@container simple-grid (min-width: 88em)"
}

export const simpleGridRules = stylex.create({
  media: {
    gridTemplateColumns: {
      default: `repeat(${simpleGridVars.cols_base}, minmax(0, 1fr))`,
      [breakpoints.xs]: `repeat(${simpleGridVars.cols_xs}, minmax(0, 1fr))`,
      [breakpoints.sm]: `repeat(${simpleGridVars.cols_sm}, minmax(0, 1fr))`,
      [breakpoints.md]: `repeat(${simpleGridVars.cols_md}, minmax(0, 1fr))`,
      [breakpoints.lg]: `repeat(${simpleGridVars.cols_lg}, minmax(0, 1fr))`,
      [breakpoints.xl]: `repeat(${simpleGridVars.cols_xl}, minmax(0, 1fr))`
    },
    columnGap: {
      default: simpleGridVars.gapX_base,
      [breakpoints.xs]: simpleGridVars.gapX_xs,
      [breakpoints.sm]: simpleGridVars.gapX_sm,
      [breakpoints.md]: simpleGridVars.gapX_md,
      [breakpoints.lg]: simpleGridVars.gapX_lg,
      [breakpoints.xl]: simpleGridVars.gapX_xl
    },
    rowGap: {
      default: simpleGridVars.gapY_base,
      [breakpoints.xs]: simpleGridVars.gapY_xs,
      [breakpoints.sm]: simpleGridVars.gapY_sm,
      [breakpoints.md]: simpleGridVars.gapY_md,
      [breakpoints.lg]: simpleGridVars.gapY_lg,
      [breakpoints.xl]: simpleGridVars.gapY_xl
    }
  },
  container: {
    gridTemplateColumns: {
      default: `repeat(${simpleGridVars.cols_base}, minmax(0, 1fr))`,
      [containerRanges.xs]: `repeat(${simpleGridVars.cols_xs}, minmax(0, 1fr))`,
      [containerRanges.sm]: `repeat(${simpleGridVars.cols_sm}, minmax(0, 1fr))`,
      [containerRanges.md]: `repeat(${simpleGridVars.cols_md}, minmax(0, 1fr))`,
      [containerRanges.lg]: `repeat(${simpleGridVars.cols_lg}, minmax(0, 1fr))`,
      [containerRanges.xl]: `repeat(${simpleGridVars.cols_xl}, minmax(0, 1fr))`
    },
    columnGap: {
      default: simpleGridVars.gapX_base,
      [containerRanges.xs]: simpleGridVars.gapX_xs,
      [containerRanges.sm]: simpleGridVars.gapX_sm,
      [containerRanges.md]: simpleGridVars.gapX_md,
      [containerRanges.lg]: simpleGridVars.gapX_lg,
      [containerRanges.xl]: simpleGridVars.gapX_xl
    },
    rowGap: {
      default: simpleGridVars.gapY_base,
      [containerRanges.xs]: simpleGridVars.gapY_xs,
      [containerRanges.sm]: simpleGridVars.gapY_sm,
      [containerRanges.md]: simpleGridVars.gapY_md,
      [containerRanges.lg]: simpleGridVars.gapY_lg,
      [containerRanges.xl]: simpleGridVars.gapY_xl
    }
  }
})
