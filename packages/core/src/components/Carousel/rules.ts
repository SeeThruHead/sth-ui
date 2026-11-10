import * as stylex from "@stylexjs/stylex"
import { carouselVars } from "./Carousel.stylex.ts"

const breakpoints = {
  xs: "@media (min-width: 36em)",
  sm: "@media (min-width: 48em)",
  md: "@media (min-width: 62em)",
  lg: "@media (min-width: 75em)",
  xl: "@media (min-width: 88em)"
}

const carouselRanges = {
  xs: "@container carousel (min-width: 36em) and (max-width: 47.99em)",
  sm: "@container carousel (min-width: 48em) and (max-width: 61.99em)",
  md: "@container carousel (min-width: 62em) and (max-width: 74.99em)",
  lg: "@container carousel (min-width: 75em) and (max-width: 87.99em)",
  xl: "@container carousel (min-width: 88em)"
}

export const carouselRules = stylex.create({
  sizeMedia: {
    flexBasis: {
      default: carouselVars.size_base,
      [breakpoints.xs]: carouselVars.size_xs,
      [breakpoints.sm]: carouselVars.size_sm,
      [breakpoints.md]: carouselVars.size_md,
      [breakpoints.lg]: carouselVars.size_lg,
      [breakpoints.xl]: carouselVars.size_xl
    }
  },
  paddingInlineMedia: {
    paddingInlineEnd: {
      default: carouselVars.gap_base,
      [breakpoints.xs]: carouselVars.gap_xs,
      [breakpoints.sm]: carouselVars.gap_sm,
      [breakpoints.md]: carouselVars.gap_md,
      [breakpoints.lg]: carouselVars.gap_lg,
      [breakpoints.xl]: carouselVars.gap_xl
    }
  },
  paddingBlockMedia: {
    paddingBottom: {
      default: carouselVars.gap_base,
      [breakpoints.xs]: carouselVars.gap_xs,
      [breakpoints.sm]: carouselVars.gap_sm,
      [breakpoints.md]: carouselVars.gap_md,
      [breakpoints.lg]: carouselVars.gap_lg,
      [breakpoints.xl]: carouselVars.gap_xl
    }
  },
  marginInlineMedia: {
    marginInlineEnd: {
      default: carouselVars.gap_base,
      [breakpoints.xs]: carouselVars.gap_xs,
      [breakpoints.sm]: carouselVars.gap_sm,
      [breakpoints.md]: carouselVars.gap_md,
      [breakpoints.lg]: carouselVars.gap_lg,
      [breakpoints.xl]: carouselVars.gap_xl
    }
  },
  marginBlockMedia: {
    marginBottom: {
      default: carouselVars.gap_base,
      [breakpoints.xs]: carouselVars.gap_xs,
      [breakpoints.sm]: carouselVars.gap_sm,
      [breakpoints.md]: carouselVars.gap_md,
      [breakpoints.lg]: carouselVars.gap_lg,
      [breakpoints.xl]: carouselVars.gap_xl
    }
  },
  pullInlineMedia: {
    marginInlineEnd: {
      default: `calc(${carouselVars.gap_base} * -1)`,
      [breakpoints.xs]: `calc(${carouselVars.gap_xs} * -1)`,
      [breakpoints.sm]: `calc(${carouselVars.gap_sm} * -1)`,
      [breakpoints.md]: `calc(${carouselVars.gap_md} * -1)`,
      [breakpoints.lg]: `calc(${carouselVars.gap_lg} * -1)`,
      [breakpoints.xl]: `calc(${carouselVars.gap_xl} * -1)`
    }
  },
  pullBlockMedia: {
    marginBottom: {
      default: `calc(${carouselVars.gap_base} * -1)`,
      [breakpoints.xs]: `calc(${carouselVars.gap_xs} * -1)`,
      [breakpoints.sm]: `calc(${carouselVars.gap_sm} * -1)`,
      [breakpoints.md]: `calc(${carouselVars.gap_md} * -1)`,
      [breakpoints.lg]: `calc(${carouselVars.gap_lg} * -1)`,
      [breakpoints.xl]: `calc(${carouselVars.gap_xl} * -1)`
    }
  },
  sizeContainer: {
    flexBasis: {
      default: carouselVars.size_base,
      [carouselRanges.xs]: carouselVars.size_xs,
      [carouselRanges.sm]: carouselVars.size_sm,
      [carouselRanges.md]: carouselVars.size_md,
      [carouselRanges.lg]: carouselVars.size_lg,
      [carouselRanges.xl]: carouselVars.size_xl
    }
  },
  paddingInlineContainer: {
    paddingInlineEnd: {
      default: carouselVars.gap_base,
      [carouselRanges.xs]: carouselVars.gap_xs,
      [carouselRanges.sm]: carouselVars.gap_sm,
      [carouselRanges.md]: carouselVars.gap_md,
      [carouselRanges.lg]: carouselVars.gap_lg,
      [carouselRanges.xl]: carouselVars.gap_xl
    }
  },
  paddingBlockContainer: {
    paddingBottom: {
      default: carouselVars.gap_base,
      [carouselRanges.xs]: carouselVars.gap_xs,
      [carouselRanges.sm]: carouselVars.gap_sm,
      [carouselRanges.md]: carouselVars.gap_md,
      [carouselRanges.lg]: carouselVars.gap_lg,
      [carouselRanges.xl]: carouselVars.gap_xl
    }
  },
  marginInlineContainer: {
    marginInlineEnd: {
      default: carouselVars.gap_base,
      [carouselRanges.xs]: carouselVars.gap_xs,
      [carouselRanges.sm]: carouselVars.gap_sm,
      [carouselRanges.md]: carouselVars.gap_md,
      [carouselRanges.lg]: carouselVars.gap_lg,
      [carouselRanges.xl]: carouselVars.gap_xl
    }
  },
  marginBlockContainer: {
    marginBottom: {
      default: carouselVars.gap_base,
      [carouselRanges.xs]: carouselVars.gap_xs,
      [carouselRanges.sm]: carouselVars.gap_sm,
      [carouselRanges.md]: carouselVars.gap_md,
      [carouselRanges.lg]: carouselVars.gap_lg,
      [carouselRanges.xl]: carouselVars.gap_xl
    }
  },
  pullInlineContainer: {
    marginInlineEnd: {
      default: `calc(${carouselVars.gap_base} * -1)`,
      [carouselRanges.xs]: `calc(${carouselVars.gap_xs} * -1)`,
      [carouselRanges.sm]: `calc(${carouselVars.gap_sm} * -1)`,
      [carouselRanges.md]: `calc(${carouselVars.gap_md} * -1)`,
      [carouselRanges.lg]: `calc(${carouselVars.gap_lg} * -1)`,
      [carouselRanges.xl]: `calc(${carouselVars.gap_xl} * -1)`
    }
  },
  pullBlockContainer: {
    marginBottom: {
      default: `calc(${carouselVars.gap_base} * -1)`,
      [carouselRanges.xs]: `calc(${carouselVars.gap_xs} * -1)`,
      [carouselRanges.sm]: `calc(${carouselVars.gap_sm} * -1)`,
      [carouselRanges.md]: `calc(${carouselVars.gap_md} * -1)`,
      [carouselRanges.lg]: `calc(${carouselVars.gap_lg} * -1)`,
      [carouselRanges.xl]: `calc(${carouselVars.gap_xl} * -1)`
    }
  }
})
