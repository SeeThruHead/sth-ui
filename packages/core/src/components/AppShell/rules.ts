import * as stylex from "@stylexjs/stylex"
import { shellVars } from "./AppShell.stylex.ts"

const breakpoints = {
  xs: "@media (min-width: 36em)",
  sm: "@media (min-width: 48em)",
  md: "@media (min-width: 62em)",
  lg: "@media (min-width: 75em)",
  xl: "@media (min-width: 88em)"
}

export const shellRules = stylex.create({
  points: {
    [shellVars.navbarWidth]: {
      default: shellVars.navbarWidth_base,
      [breakpoints.xs]: shellVars.navbarWidth_xs,
      [breakpoints.sm]: shellVars.navbarWidth_sm,
      [breakpoints.md]: shellVars.navbarWidth_md,
      [breakpoints.lg]: shellVars.navbarWidth_lg,
      [breakpoints.xl]: shellVars.navbarWidth_xl
    },
    [shellVars.navbarOffset]: {
      default: shellVars.navbarOffset_base,
      [breakpoints.xs]: shellVars.navbarOffset_xs,
      [breakpoints.sm]: shellVars.navbarOffset_sm,
      [breakpoints.md]: shellVars.navbarOffset_md,
      [breakpoints.lg]: shellVars.navbarOffset_lg,
      [breakpoints.xl]: shellVars.navbarOffset_xl
    },
    [shellVars.navbarTransform]: {
      default: shellVars.navbarTransform_base,
      [breakpoints.xs]: shellVars.navbarTransform_xs,
      [breakpoints.sm]: shellVars.navbarTransform_sm,
      [breakpoints.md]: shellVars.navbarTransform_md,
      [breakpoints.lg]: shellVars.navbarTransform_lg,
      [breakpoints.xl]: shellVars.navbarTransform_xl
    },
    [shellVars.navbarPosition]: {
      default: shellVars.navbarPosition_base,
      [breakpoints.xs]: shellVars.navbarPosition_xs,
      [breakpoints.sm]: shellVars.navbarPosition_sm,
      [breakpoints.md]: shellVars.navbarPosition_md,
      [breakpoints.lg]: shellVars.navbarPosition_lg,
      [breakpoints.xl]: shellVars.navbarPosition_xl
    },
    [shellVars.navbarDisplay]: {
      default: shellVars.navbarDisplay_base,
      [breakpoints.xs]: shellVars.navbarDisplay_xs,
      [breakpoints.sm]: shellVars.navbarDisplay_sm,
      [breakpoints.md]: shellVars.navbarDisplay_md,
      [breakpoints.lg]: shellVars.navbarDisplay_lg,
      [breakpoints.xl]: shellVars.navbarDisplay_xl
    },
    [shellVars.navbarRow]: {
      default: shellVars.navbarRow_base,
      [breakpoints.xs]: shellVars.navbarRow_xs,
      [breakpoints.sm]: shellVars.navbarRow_sm,
      [breakpoints.md]: shellVars.navbarRow_md,
      [breakpoints.lg]: shellVars.navbarRow_lg,
      [breakpoints.xl]: shellVars.navbarRow_xl
    },
    [shellVars.navbarColumn]: {
      default: shellVars.navbarColumn_base,
      [breakpoints.xs]: shellVars.navbarColumn_xs,
      [breakpoints.sm]: shellVars.navbarColumn_sm,
      [breakpoints.md]: shellVars.navbarColumn_md,
      [breakpoints.lg]: shellVars.navbarColumn_lg,
      [breakpoints.xl]: shellVars.navbarColumn_xl
    },
    [shellVars.navbarHandle]: {
      default: shellVars.navbarHandle_base,
      [breakpoints.xs]: shellVars.navbarHandle_xs,
      [breakpoints.sm]: shellVars.navbarHandle_sm,
      [breakpoints.md]: shellVars.navbarHandle_md,
      [breakpoints.lg]: shellVars.navbarHandle_lg,
      [breakpoints.xl]: shellVars.navbarHandle_xl
    },
    [shellVars.asideWidth]: {
      default: shellVars.asideWidth_base,
      [breakpoints.xs]: shellVars.asideWidth_xs,
      [breakpoints.sm]: shellVars.asideWidth_sm,
      [breakpoints.md]: shellVars.asideWidth_md,
      [breakpoints.lg]: shellVars.asideWidth_lg,
      [breakpoints.xl]: shellVars.asideWidth_xl
    },
    [shellVars.asideOffset]: {
      default: shellVars.asideOffset_base,
      [breakpoints.xs]: shellVars.asideOffset_xs,
      [breakpoints.sm]: shellVars.asideOffset_sm,
      [breakpoints.md]: shellVars.asideOffset_md,
      [breakpoints.lg]: shellVars.asideOffset_lg,
      [breakpoints.xl]: shellVars.asideOffset_xl
    },
    [shellVars.asideTransform]: {
      default: shellVars.asideTransform_base,
      [breakpoints.xs]: shellVars.asideTransform_xs,
      [breakpoints.sm]: shellVars.asideTransform_sm,
      [breakpoints.md]: shellVars.asideTransform_md,
      [breakpoints.lg]: shellVars.asideTransform_lg,
      [breakpoints.xl]: shellVars.asideTransform_xl
    },
    [shellVars.asidePosition]: {
      default: shellVars.asidePosition_base,
      [breakpoints.xs]: shellVars.asidePosition_xs,
      [breakpoints.sm]: shellVars.asidePosition_sm,
      [breakpoints.md]: shellVars.asidePosition_md,
      [breakpoints.lg]: shellVars.asidePosition_lg,
      [breakpoints.xl]: shellVars.asidePosition_xl
    },
    [shellVars.asideDisplay]: {
      default: shellVars.asideDisplay_base,
      [breakpoints.xs]: shellVars.asideDisplay_xs,
      [breakpoints.sm]: shellVars.asideDisplay_sm,
      [breakpoints.md]: shellVars.asideDisplay_md,
      [breakpoints.lg]: shellVars.asideDisplay_lg,
      [breakpoints.xl]: shellVars.asideDisplay_xl
    },
    [shellVars.asideRow]: {
      default: shellVars.asideRow_base,
      [breakpoints.xs]: shellVars.asideRow_xs,
      [breakpoints.sm]: shellVars.asideRow_sm,
      [breakpoints.md]: shellVars.asideRow_md,
      [breakpoints.lg]: shellVars.asideRow_lg,
      [breakpoints.xl]: shellVars.asideRow_xl
    },
    [shellVars.asideColumn]: {
      default: shellVars.asideColumn_base,
      [breakpoints.xs]: shellVars.asideColumn_xs,
      [breakpoints.sm]: shellVars.asideColumn_sm,
      [breakpoints.md]: shellVars.asideColumn_md,
      [breakpoints.lg]: shellVars.asideColumn_lg,
      [breakpoints.xl]: shellVars.asideColumn_xl
    },
    [shellVars.asideHandle]: {
      default: shellVars.asideHandle_base,
      [breakpoints.xs]: shellVars.asideHandle_xs,
      [breakpoints.sm]: shellVars.asideHandle_sm,
      [breakpoints.md]: shellVars.asideHandle_md,
      [breakpoints.lg]: shellVars.asideHandle_lg,
      [breakpoints.xl]: shellVars.asideHandle_xl
    },
    [shellVars.headerHeight]: {
      default: shellVars.headerHeight_base,
      [breakpoints.xs]: shellVars.headerHeight_xs,
      [breakpoints.sm]: shellVars.headerHeight_sm,
      [breakpoints.md]: shellVars.headerHeight_md,
      [breakpoints.lg]: shellVars.headerHeight_lg,
      [breakpoints.xl]: shellVars.headerHeight_xl
    },
    [shellVars.headerOffset]: {
      default: shellVars.headerOffset_base,
      [breakpoints.xs]: shellVars.headerOffset_xs,
      [breakpoints.sm]: shellVars.headerOffset_sm,
      [breakpoints.md]: shellVars.headerOffset_md,
      [breakpoints.lg]: shellVars.headerOffset_lg,
      [breakpoints.xl]: shellVars.headerOffset_xl
    },
    [shellVars.footerHeight]: {
      default: shellVars.footerHeight_base,
      [breakpoints.xs]: shellVars.footerHeight_xs,
      [breakpoints.sm]: shellVars.footerHeight_sm,
      [breakpoints.md]: shellVars.footerHeight_md,
      [breakpoints.lg]: shellVars.footerHeight_lg,
      [breakpoints.xl]: shellVars.footerHeight_xl
    },
    [shellVars.footerOffset]: {
      default: shellVars.footerOffset_base,
      [breakpoints.xs]: shellVars.footerOffset_xs,
      [breakpoints.sm]: shellVars.footerOffset_sm,
      [breakpoints.md]: shellVars.footerOffset_md,
      [breakpoints.lg]: shellVars.footerOffset_lg,
      [breakpoints.xl]: shellVars.footerOffset_xl
    },
    [shellVars.padding]: {
      default: shellVars.padding_base,
      [breakpoints.xs]: shellVars.padding_xs,
      [breakpoints.sm]: shellVars.padding_sm,
      [breakpoints.md]: shellVars.padding_md,
      [breakpoints.lg]: shellVars.padding_lg,
      [breakpoints.xl]: shellVars.padding_xl
    },
    [shellVars.columns]: {
      default: shellVars.columns_base,
      [breakpoints.xs]: shellVars.columns_xs,
      [breakpoints.sm]: shellVars.columns_sm,
      [breakpoints.md]: shellVars.columns_md,
      [breakpoints.lg]: shellVars.columns_lg,
      [breakpoints.xl]: shellVars.columns_xl
    },
    [shellVars.mainStart]: {
      default: shellVars.mainStart_base,
      [breakpoints.xs]: shellVars.mainStart_xs,
      [breakpoints.sm]: shellVars.mainStart_sm,
      [breakpoints.md]: shellVars.mainStart_md,
      [breakpoints.lg]: shellVars.mainStart_lg,
      [breakpoints.xl]: shellVars.mainStart_xl
    },
    [shellVars.mainEnd]: {
      default: shellVars.mainEnd_base,
      [breakpoints.xs]: shellVars.mainEnd_xs,
      [breakpoints.sm]: shellVars.mainEnd_sm,
      [breakpoints.md]: shellVars.mainEnd_md,
      [breakpoints.lg]: shellVars.mainEnd_lg,
      [breakpoints.xl]: shellVars.mainEnd_xl
    }
  }
})
