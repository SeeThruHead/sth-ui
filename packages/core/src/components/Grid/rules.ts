import * as stylex from "@stylexjs/stylex"
import { gridVars } from "./Grid.stylex.ts"

const breakpoints = {
  xs: "@media (min-width: 36em)",
  sm: "@media (min-width: 48em)",
  md: "@media (min-width: 62em)",
  lg: "@media (min-width: 75em)",
  xl: "@media (min-width: 88em)"
}

const gridContainerRanges = {
  xs: "@container sth-grid (min-width: 36em) and (max-width: 47.99em)",
  sm: "@container sth-grid (min-width: 48em) and (max-width: 61.99em)",
  md: "@container sth-grid (min-width: 62em) and (max-width: 74.99em)",
  lg: "@container sth-grid (min-width: 75em) and (max-width: 87.99em)",
  xl: "@container sth-grid (min-width: 88em)"
}

export const gridRules = stylex.create({
  colMedia: {
    order: {
      default: gridVars.order_base,
      [breakpoints.xs]: gridVars.order_xs,
      [breakpoints.sm]: gridVars.order_sm,
      [breakpoints.md]: gridVars.order_md,
      [breakpoints.lg]: gridVars.order_lg,
      [breakpoints.xl]: gridVars.order_xl
    },
    flexGrow: {
      default: gridVars.grow_base,
      [breakpoints.xs]: gridVars.grow_xs,
      [breakpoints.sm]: gridVars.grow_sm,
      [breakpoints.md]: gridVars.grow_md,
      [breakpoints.lg]: gridVars.grow_lg,
      [breakpoints.xl]: gridVars.grow_xl
    },
    flexBasis: {
      default: gridVars.basis_base,
      [breakpoints.xs]: gridVars.basis_xs,
      [breakpoints.sm]: gridVars.basis_sm,
      [breakpoints.md]: gridVars.basis_md,
      [breakpoints.lg]: gridVars.basis_lg,
      [breakpoints.xl]: gridVars.basis_xl
    },
    maxWidth: {
      default: gridVars.maxWidth_base,
      [breakpoints.xs]: gridVars.maxWidth_xs,
      [breakpoints.sm]: gridVars.maxWidth_sm,
      [breakpoints.md]: gridVars.maxWidth_md,
      [breakpoints.lg]: gridVars.maxWidth_lg,
      [breakpoints.xl]: gridVars.maxWidth_xl
    },
    marginInlineStart: {
      default: gridVars.offset_base,
      [breakpoints.xs]: gridVars.offset_xs,
      [breakpoints.sm]: gridVars.offset_sm,
      [breakpoints.md]: gridVars.offset_md,
      [breakpoints.lg]: gridVars.offset_lg,
      [breakpoints.xl]: gridVars.offset_xl
    },
    alignSelf: {
      default: gridVars.alignSelf_base,
      [breakpoints.xs]: gridVars.alignSelf_xs,
      [breakpoints.sm]: gridVars.alignSelf_sm,
      [breakpoints.md]: gridVars.alignSelf_md,
      [breakpoints.lg]: gridVars.alignSelf_lg,
      [breakpoints.xl]: gridVars.alignSelf_xl
    }
  },
  colContainer: {
    order: {
      default: gridVars.order_base,
      [gridContainerRanges.xs]: gridVars.order_xs,
      [gridContainerRanges.sm]: gridVars.order_sm,
      [gridContainerRanges.md]: gridVars.order_md,
      [gridContainerRanges.lg]: gridVars.order_lg,
      [gridContainerRanges.xl]: gridVars.order_xl
    },
    flexGrow: {
      default: gridVars.grow_base,
      [gridContainerRanges.xs]: gridVars.grow_xs,
      [gridContainerRanges.sm]: gridVars.grow_sm,
      [gridContainerRanges.md]: gridVars.grow_md,
      [gridContainerRanges.lg]: gridVars.grow_lg,
      [gridContainerRanges.xl]: gridVars.grow_xl
    },
    flexBasis: {
      default: gridVars.basis_base,
      [gridContainerRanges.xs]: gridVars.basis_xs,
      [gridContainerRanges.sm]: gridVars.basis_sm,
      [gridContainerRanges.md]: gridVars.basis_md,
      [gridContainerRanges.lg]: gridVars.basis_lg,
      [gridContainerRanges.xl]: gridVars.basis_xl
    },
    maxWidth: {
      default: gridVars.maxWidth_base,
      [gridContainerRanges.xs]: gridVars.maxWidth_xs,
      [gridContainerRanges.sm]: gridVars.maxWidth_sm,
      [gridContainerRanges.md]: gridVars.maxWidth_md,
      [gridContainerRanges.lg]: gridVars.maxWidth_lg,
      [gridContainerRanges.xl]: gridVars.maxWidth_xl
    },
    marginInlineStart: {
      default: gridVars.offset_base,
      [gridContainerRanges.xs]: gridVars.offset_xs,
      [gridContainerRanges.sm]: gridVars.offset_sm,
      [gridContainerRanges.md]: gridVars.offset_md,
      [gridContainerRanges.lg]: gridVars.offset_lg,
      [gridContainerRanges.xl]: gridVars.offset_xl
    },
    alignSelf: {
      default: gridVars.alignSelf_base,
      [gridContainerRanges.xs]: gridVars.alignSelf_xs,
      [gridContainerRanges.sm]: gridVars.alignSelf_sm,
      [gridContainerRanges.md]: gridVars.alignSelf_md,
      [gridContainerRanges.lg]: gridVars.alignSelf_lg,
      [gridContainerRanges.xl]: gridVars.alignSelf_xl
    }
  },
  gapMedia: {
    [gridVars.gap]: {
      default: gridVars.gap_base,
      [breakpoints.xs]: gridVars.gap_xs,
      [breakpoints.sm]: gridVars.gap_sm,
      [breakpoints.md]: gridVars.gap_md,
      [breakpoints.lg]: gridVars.gap_lg,
      [breakpoints.xl]: gridVars.gap_xl
    }
  },
  gapContainer: {
    [gridVars.gap]: {
      default: gridVars.gap_base,
      [gridContainerRanges.xs]: gridVars.gap_xs,
      [gridContainerRanges.sm]: gridVars.gap_sm,
      [gridContainerRanges.md]: gridVars.gap_md,
      [gridContainerRanges.lg]: gridVars.gap_lg,
      [gridContainerRanges.xl]: gridVars.gap_xl
    }
  }
})
