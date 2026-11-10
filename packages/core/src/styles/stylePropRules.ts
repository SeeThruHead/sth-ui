import * as stylex from "@stylexjs/stylex"
import { stylePropVars } from "./stylePropVars.stylex.ts"

const breakpoints = {
  xs: "@media (min-width: 36em)",
  sm: "@media (min-width: 48em)",
  md: "@media (min-width: 62em)",
  lg: "@media (min-width: 75em)",
  xl: "@media (min-width: 88em)"
}

export const stylePropRules = stylex.create({
  m: {
    margin: {
      default: stylePropVars.m_base,
      [breakpoints.xs]: stylePropVars.m_xs,
      [breakpoints.sm]: stylePropVars.m_sm,
      [breakpoints.md]: stylePropVars.m_md,
      [breakpoints.lg]: stylePropVars.m_lg,
      [breakpoints.xl]: stylePropVars.m_xl
    }
  },
  mt: {
    marginTop: {
      default: stylePropVars.mt_base,
      [breakpoints.xs]: stylePropVars.mt_xs,
      [breakpoints.sm]: stylePropVars.mt_sm,
      [breakpoints.md]: stylePropVars.mt_md,
      [breakpoints.lg]: stylePropVars.mt_lg,
      [breakpoints.xl]: stylePropVars.mt_xl
    }
  },
  mb: {
    marginBottom: {
      default: stylePropVars.mb_base,
      [breakpoints.xs]: stylePropVars.mb_xs,
      [breakpoints.sm]: stylePropVars.mb_sm,
      [breakpoints.md]: stylePropVars.mb_md,
      [breakpoints.lg]: stylePropVars.mb_lg,
      [breakpoints.xl]: stylePropVars.mb_xl
    }
  },
  ml: {
    marginLeft: {
      default: stylePropVars.ml_base,
      [breakpoints.xs]: stylePropVars.ml_xs,
      [breakpoints.sm]: stylePropVars.ml_sm,
      [breakpoints.md]: stylePropVars.ml_md,
      [breakpoints.lg]: stylePropVars.ml_lg,
      [breakpoints.xl]: stylePropVars.ml_xl
    }
  },
  mr: {
    marginRight: {
      default: stylePropVars.mr_base,
      [breakpoints.xs]: stylePropVars.mr_xs,
      [breakpoints.sm]: stylePropVars.mr_sm,
      [breakpoints.md]: stylePropVars.mr_md,
      [breakpoints.lg]: stylePropVars.mr_lg,
      [breakpoints.xl]: stylePropVars.mr_xl
    }
  },
  ms: {
    marginInlineStart: {
      default: stylePropVars.ms_base,
      [breakpoints.xs]: stylePropVars.ms_xs,
      [breakpoints.sm]: stylePropVars.ms_sm,
      [breakpoints.md]: stylePropVars.ms_md,
      [breakpoints.lg]: stylePropVars.ms_lg,
      [breakpoints.xl]: stylePropVars.ms_xl
    }
  },
  me: {
    marginInlineEnd: {
      default: stylePropVars.me_base,
      [breakpoints.xs]: stylePropVars.me_xs,
      [breakpoints.sm]: stylePropVars.me_sm,
      [breakpoints.md]: stylePropVars.me_md,
      [breakpoints.lg]: stylePropVars.me_lg,
      [breakpoints.xl]: stylePropVars.me_xl
    }
  },
  mx: {
    marginInline: {
      default: stylePropVars.mx_base,
      [breakpoints.xs]: stylePropVars.mx_xs,
      [breakpoints.sm]: stylePropVars.mx_sm,
      [breakpoints.md]: stylePropVars.mx_md,
      [breakpoints.lg]: stylePropVars.mx_lg,
      [breakpoints.xl]: stylePropVars.mx_xl
    }
  },
  my: {
    marginBlock: {
      default: stylePropVars.my_base,
      [breakpoints.xs]: stylePropVars.my_xs,
      [breakpoints.sm]: stylePropVars.my_sm,
      [breakpoints.md]: stylePropVars.my_md,
      [breakpoints.lg]: stylePropVars.my_lg,
      [breakpoints.xl]: stylePropVars.my_xl
    }
  },
  p: {
    padding: {
      default: stylePropVars.p_base,
      [breakpoints.xs]: stylePropVars.p_xs,
      [breakpoints.sm]: stylePropVars.p_sm,
      [breakpoints.md]: stylePropVars.p_md,
      [breakpoints.lg]: stylePropVars.p_lg,
      [breakpoints.xl]: stylePropVars.p_xl
    }
  },
  pt: {
    paddingTop: {
      default: stylePropVars.pt_base,
      [breakpoints.xs]: stylePropVars.pt_xs,
      [breakpoints.sm]: stylePropVars.pt_sm,
      [breakpoints.md]: stylePropVars.pt_md,
      [breakpoints.lg]: stylePropVars.pt_lg,
      [breakpoints.xl]: stylePropVars.pt_xl
    }
  },
  pb: {
    paddingBottom: {
      default: stylePropVars.pb_base,
      [breakpoints.xs]: stylePropVars.pb_xs,
      [breakpoints.sm]: stylePropVars.pb_sm,
      [breakpoints.md]: stylePropVars.pb_md,
      [breakpoints.lg]: stylePropVars.pb_lg,
      [breakpoints.xl]: stylePropVars.pb_xl
    }
  },
  pl: {
    paddingLeft: {
      default: stylePropVars.pl_base,
      [breakpoints.xs]: stylePropVars.pl_xs,
      [breakpoints.sm]: stylePropVars.pl_sm,
      [breakpoints.md]: stylePropVars.pl_md,
      [breakpoints.lg]: stylePropVars.pl_lg,
      [breakpoints.xl]: stylePropVars.pl_xl
    }
  },
  pr: {
    paddingRight: {
      default: stylePropVars.pr_base,
      [breakpoints.xs]: stylePropVars.pr_xs,
      [breakpoints.sm]: stylePropVars.pr_sm,
      [breakpoints.md]: stylePropVars.pr_md,
      [breakpoints.lg]: stylePropVars.pr_lg,
      [breakpoints.xl]: stylePropVars.pr_xl
    }
  },
  ps: {
    paddingInlineStart: {
      default: stylePropVars.ps_base,
      [breakpoints.xs]: stylePropVars.ps_xs,
      [breakpoints.sm]: stylePropVars.ps_sm,
      [breakpoints.md]: stylePropVars.ps_md,
      [breakpoints.lg]: stylePropVars.ps_lg,
      [breakpoints.xl]: stylePropVars.ps_xl
    }
  },
  pe: {
    paddingInlineEnd: {
      default: stylePropVars.pe_base,
      [breakpoints.xs]: stylePropVars.pe_xs,
      [breakpoints.sm]: stylePropVars.pe_sm,
      [breakpoints.md]: stylePropVars.pe_md,
      [breakpoints.lg]: stylePropVars.pe_lg,
      [breakpoints.xl]: stylePropVars.pe_xl
    }
  },
  px: {
    paddingInline: {
      default: stylePropVars.px_base,
      [breakpoints.xs]: stylePropVars.px_xs,
      [breakpoints.sm]: stylePropVars.px_sm,
      [breakpoints.md]: stylePropVars.px_md,
      [breakpoints.lg]: stylePropVars.px_lg,
      [breakpoints.xl]: stylePropVars.px_xl
    }
  },
  py: {
    paddingBlock: {
      default: stylePropVars.py_base,
      [breakpoints.xs]: stylePropVars.py_xs,
      [breakpoints.sm]: stylePropVars.py_sm,
      [breakpoints.md]: stylePropVars.py_md,
      [breakpoints.lg]: stylePropVars.py_lg,
      [breakpoints.xl]: stylePropVars.py_xl
    }
  },
  bdrs: {
    borderRadius: {
      default: stylePropVars.bdrs_base,
      [breakpoints.xs]: stylePropVars.bdrs_xs,
      [breakpoints.sm]: stylePropVars.bdrs_sm,
      [breakpoints.md]: stylePropVars.bdrs_md,
      [breakpoints.lg]: stylePropVars.bdrs_lg,
      [breakpoints.xl]: stylePropVars.bdrs_xl
    }
  },
  c: {
    color: {
      default: stylePropVars.c_base,
      [breakpoints.xs]: stylePropVars.c_xs,
      [breakpoints.sm]: stylePropVars.c_sm,
      [breakpoints.md]: stylePropVars.c_md,
      [breakpoints.lg]: stylePropVars.c_lg,
      [breakpoints.xl]: stylePropVars.c_xl
    }
  },
  opacity: {
    opacity: {
      default: stylePropVars.opacity_base,
      [breakpoints.xs]: stylePropVars.opacity_xs,
      [breakpoints.sm]: stylePropVars.opacity_sm,
      [breakpoints.md]: stylePropVars.opacity_md,
      [breakpoints.lg]: stylePropVars.opacity_lg,
      [breakpoints.xl]: stylePropVars.opacity_xl
    }
  },
  ff: {
    fontFamily: {
      default: stylePropVars.ff_base,
      [breakpoints.xs]: stylePropVars.ff_xs,
      [breakpoints.sm]: stylePropVars.ff_sm,
      [breakpoints.md]: stylePropVars.ff_md,
      [breakpoints.lg]: stylePropVars.ff_lg,
      [breakpoints.xl]: stylePropVars.ff_xl
    }
  },
  fz: {
    fontSize: {
      default: stylePropVars.fz_base,
      [breakpoints.xs]: stylePropVars.fz_xs,
      [breakpoints.sm]: stylePropVars.fz_sm,
      [breakpoints.md]: stylePropVars.fz_md,
      [breakpoints.lg]: stylePropVars.fz_lg,
      [breakpoints.xl]: stylePropVars.fz_xl
    }
  },
  fw: {
    fontWeight: {
      default: stylePropVars.fw_base,
      [breakpoints.xs]: stylePropVars.fw_xs,
      [breakpoints.sm]: stylePropVars.fw_sm,
      [breakpoints.md]: stylePropVars.fw_md,
      [breakpoints.lg]: stylePropVars.fw_lg,
      [breakpoints.xl]: stylePropVars.fw_xl
    }
  },
  lts: {
    letterSpacing: {
      default: stylePropVars.lts_base,
      [breakpoints.xs]: stylePropVars.lts_xs,
      [breakpoints.sm]: stylePropVars.lts_sm,
      [breakpoints.md]: stylePropVars.lts_md,
      [breakpoints.lg]: stylePropVars.lts_lg,
      [breakpoints.xl]: stylePropVars.lts_xl
    }
  },
  ta: {
    textAlign: {
      default: stylePropVars.ta_base,
      [breakpoints.xs]: stylePropVars.ta_xs,
      [breakpoints.sm]: stylePropVars.ta_sm,
      [breakpoints.md]: stylePropVars.ta_md,
      [breakpoints.lg]: stylePropVars.ta_lg,
      [breakpoints.xl]: stylePropVars.ta_xl
    }
  },
  lh: {
    lineHeight: {
      default: stylePropVars.lh_base,
      [breakpoints.xs]: stylePropVars.lh_xs,
      [breakpoints.sm]: stylePropVars.lh_sm,
      [breakpoints.md]: stylePropVars.lh_md,
      [breakpoints.lg]: stylePropVars.lh_lg,
      [breakpoints.xl]: stylePropVars.lh_xl
    }
  },
  fs: {
    fontStyle: {
      default: stylePropVars.fs_base,
      [breakpoints.xs]: stylePropVars.fs_xs,
      [breakpoints.sm]: stylePropVars.fs_sm,
      [breakpoints.md]: stylePropVars.fs_md,
      [breakpoints.lg]: stylePropVars.fs_lg,
      [breakpoints.xl]: stylePropVars.fs_xl
    }
  },
  tt: {
    textTransform: {
      default: stylePropVars.tt_base,
      [breakpoints.xs]: stylePropVars.tt_xs,
      [breakpoints.sm]: stylePropVars.tt_sm,
      [breakpoints.md]: stylePropVars.tt_md,
      [breakpoints.lg]: stylePropVars.tt_lg,
      [breakpoints.xl]: stylePropVars.tt_xl
    }
  },
  td: {
    textDecoration: {
      default: stylePropVars.td_base,
      [breakpoints.xs]: stylePropVars.td_xs,
      [breakpoints.sm]: stylePropVars.td_sm,
      [breakpoints.md]: stylePropVars.td_md,
      [breakpoints.lg]: stylePropVars.td_lg,
      [breakpoints.xl]: stylePropVars.td_xl
    }
  },
  w: {
    width: {
      default: stylePropVars.w_base,
      [breakpoints.xs]: stylePropVars.w_xs,
      [breakpoints.sm]: stylePropVars.w_sm,
      [breakpoints.md]: stylePropVars.w_md,
      [breakpoints.lg]: stylePropVars.w_lg,
      [breakpoints.xl]: stylePropVars.w_xl
    }
  },
  miw: {
    minWidth: {
      default: stylePropVars.miw_base,
      [breakpoints.xs]: stylePropVars.miw_xs,
      [breakpoints.sm]: stylePropVars.miw_sm,
      [breakpoints.md]: stylePropVars.miw_md,
      [breakpoints.lg]: stylePropVars.miw_lg,
      [breakpoints.xl]: stylePropVars.miw_xl
    }
  },
  maw: {
    maxWidth: {
      default: stylePropVars.maw_base,
      [breakpoints.xs]: stylePropVars.maw_xs,
      [breakpoints.sm]: stylePropVars.maw_sm,
      [breakpoints.md]: stylePropVars.maw_md,
      [breakpoints.lg]: stylePropVars.maw_lg,
      [breakpoints.xl]: stylePropVars.maw_xl
    }
  },
  h: {
    height: {
      default: stylePropVars.h_base,
      [breakpoints.xs]: stylePropVars.h_xs,
      [breakpoints.sm]: stylePropVars.h_sm,
      [breakpoints.md]: stylePropVars.h_md,
      [breakpoints.lg]: stylePropVars.h_lg,
      [breakpoints.xl]: stylePropVars.h_xl
    }
  },
  mih: {
    minHeight: {
      default: stylePropVars.mih_base,
      [breakpoints.xs]: stylePropVars.mih_xs,
      [breakpoints.sm]: stylePropVars.mih_sm,
      [breakpoints.md]: stylePropVars.mih_md,
      [breakpoints.lg]: stylePropVars.mih_lg,
      [breakpoints.xl]: stylePropVars.mih_xl
    }
  },
  mah: {
    maxHeight: {
      default: stylePropVars.mah_base,
      [breakpoints.xs]: stylePropVars.mah_xs,
      [breakpoints.sm]: stylePropVars.mah_sm,
      [breakpoints.md]: stylePropVars.mah_md,
      [breakpoints.lg]: stylePropVars.mah_lg,
      [breakpoints.xl]: stylePropVars.mah_xl
    }
  },
  bgsz: {
    backgroundSize: {
      default: stylePropVars.bgsz_base,
      [breakpoints.xs]: stylePropVars.bgsz_xs,
      [breakpoints.sm]: stylePropVars.bgsz_sm,
      [breakpoints.md]: stylePropVars.bgsz_md,
      [breakpoints.lg]: stylePropVars.bgsz_lg,
      [breakpoints.xl]: stylePropVars.bgsz_xl
    }
  },
  bgp: {
    backgroundPosition: {
      default: stylePropVars.bgp_base,
      [breakpoints.xs]: stylePropVars.bgp_xs,
      [breakpoints.sm]: stylePropVars.bgp_sm,
      [breakpoints.md]: stylePropVars.bgp_md,
      [breakpoints.lg]: stylePropVars.bgp_lg,
      [breakpoints.xl]: stylePropVars.bgp_xl
    }
  },
  bgr: {
    backgroundRepeat: {
      default: stylePropVars.bgr_base,
      [breakpoints.xs]: stylePropVars.bgr_xs,
      [breakpoints.sm]: stylePropVars.bgr_sm,
      [breakpoints.md]: stylePropVars.bgr_md,
      [breakpoints.lg]: stylePropVars.bgr_lg,
      [breakpoints.xl]: stylePropVars.bgr_xl
    }
  },
  bga: {
    backgroundAttachment: {
      default: stylePropVars.bga_base,
      [breakpoints.xs]: stylePropVars.bga_xs,
      [breakpoints.sm]: stylePropVars.bga_sm,
      [breakpoints.md]: stylePropVars.bga_md,
      [breakpoints.lg]: stylePropVars.bga_lg,
      [breakpoints.xl]: stylePropVars.bga_xl
    }
  },
  pos: {
    position: {
      default: stylePropVars.pos_base,
      [breakpoints.xs]: stylePropVars.pos_xs,
      [breakpoints.sm]: stylePropVars.pos_sm,
      [breakpoints.md]: stylePropVars.pos_md,
      [breakpoints.lg]: stylePropVars.pos_lg,
      [breakpoints.xl]: stylePropVars.pos_xl
    }
  },
  top: {
    top: {
      default: stylePropVars.top_base,
      [breakpoints.xs]: stylePropVars.top_xs,
      [breakpoints.sm]: stylePropVars.top_sm,
      [breakpoints.md]: stylePropVars.top_md,
      [breakpoints.lg]: stylePropVars.top_lg,
      [breakpoints.xl]: stylePropVars.top_xl
    }
  },
  left: {
    left: {
      default: stylePropVars.left_base,
      [breakpoints.xs]: stylePropVars.left_xs,
      [breakpoints.sm]: stylePropVars.left_sm,
      [breakpoints.md]: stylePropVars.left_md,
      [breakpoints.lg]: stylePropVars.left_lg,
      [breakpoints.xl]: stylePropVars.left_xl
    }
  },
  bottom: {
    bottom: {
      default: stylePropVars.bottom_base,
      [breakpoints.xs]: stylePropVars.bottom_xs,
      [breakpoints.sm]: stylePropVars.bottom_sm,
      [breakpoints.md]: stylePropVars.bottom_md,
      [breakpoints.lg]: stylePropVars.bottom_lg,
      [breakpoints.xl]: stylePropVars.bottom_xl
    }
  },
  right: {
    right: {
      default: stylePropVars.right_base,
      [breakpoints.xs]: stylePropVars.right_xs,
      [breakpoints.sm]: stylePropVars.right_sm,
      [breakpoints.md]: stylePropVars.right_md,
      [breakpoints.lg]: stylePropVars.right_lg,
      [breakpoints.xl]: stylePropVars.right_xl
    }
  },
  inset: {
    inset: {
      default: stylePropVars.inset_base,
      [breakpoints.xs]: stylePropVars.inset_xs,
      [breakpoints.sm]: stylePropVars.inset_sm,
      [breakpoints.md]: stylePropVars.inset_md,
      [breakpoints.lg]: stylePropVars.inset_lg,
      [breakpoints.xl]: stylePropVars.inset_xl
    }
  },
  display: {
    display: {
      default: stylePropVars.display_base,
      [breakpoints.xs]: stylePropVars.display_xs,
      [breakpoints.sm]: stylePropVars.display_sm,
      [breakpoints.md]: stylePropVars.display_md,
      [breakpoints.lg]: stylePropVars.display_lg,
      [breakpoints.xl]: stylePropVars.display_xl
    }
  },
  flex: {
    flex: {
      default: stylePropVars.flex_base,
      [breakpoints.xs]: stylePropVars.flex_xs,
      [breakpoints.sm]: stylePropVars.flex_sm,
      [breakpoints.md]: stylePropVars.flex_md,
      [breakpoints.lg]: stylePropVars.flex_lg,
      [breakpoints.xl]: stylePropVars.flex_xl
    }
  },
  fxGap: {
    gap: {
      default: stylePropVars.fxGap_base,
      [breakpoints.xs]: stylePropVars.fxGap_xs,
      [breakpoints.sm]: stylePropVars.fxGap_sm,
      [breakpoints.md]: stylePropVars.fxGap_md,
      [breakpoints.lg]: stylePropVars.fxGap_lg,
      [breakpoints.xl]: stylePropVars.fxGap_xl
    }
  },
  fxRowGap: {
    rowGap: {
      default: stylePropVars.fxRowGap_base,
      [breakpoints.xs]: stylePropVars.fxRowGap_xs,
      [breakpoints.sm]: stylePropVars.fxRowGap_sm,
      [breakpoints.md]: stylePropVars.fxRowGap_md,
      [breakpoints.lg]: stylePropVars.fxRowGap_lg,
      [breakpoints.xl]: stylePropVars.fxRowGap_xl
    }
  },
  fxColumnGap: {
    columnGap: {
      default: stylePropVars.fxColumnGap_base,
      [breakpoints.xs]: stylePropVars.fxColumnGap_xs,
      [breakpoints.sm]: stylePropVars.fxColumnGap_sm,
      [breakpoints.md]: stylePropVars.fxColumnGap_md,
      [breakpoints.lg]: stylePropVars.fxColumnGap_lg,
      [breakpoints.xl]: stylePropVars.fxColumnGap_xl
    }
  },
  fxAlign: {
    alignItems: {
      default: stylePropVars.fxAlign_base,
      [breakpoints.xs]: stylePropVars.fxAlign_xs,
      [breakpoints.sm]: stylePropVars.fxAlign_sm,
      [breakpoints.md]: stylePropVars.fxAlign_md,
      [breakpoints.lg]: stylePropVars.fxAlign_lg,
      [breakpoints.xl]: stylePropVars.fxAlign_xl
    }
  },
  fxJustify: {
    justifyContent: {
      default: stylePropVars.fxJustify_base,
      [breakpoints.xs]: stylePropVars.fxJustify_xs,
      [breakpoints.sm]: stylePropVars.fxJustify_sm,
      [breakpoints.md]: stylePropVars.fxJustify_md,
      [breakpoints.lg]: stylePropVars.fxJustify_lg,
      [breakpoints.xl]: stylePropVars.fxJustify_xl
    }
  },
  fxWrap: {
    flexWrap: {
      default: stylePropVars.fxWrap_base,
      [breakpoints.xs]: stylePropVars.fxWrap_xs,
      [breakpoints.sm]: stylePropVars.fxWrap_sm,
      [breakpoints.md]: stylePropVars.fxWrap_md,
      [breakpoints.lg]: stylePropVars.fxWrap_lg,
      [breakpoints.xl]: stylePropVars.fxWrap_xl
    }
  },
  fxDirection: {
    flexDirection: {
      default: stylePropVars.fxDirection_base,
      [breakpoints.xs]: stylePropVars.fxDirection_xs,
      [breakpoints.sm]: stylePropVars.fxDirection_sm,
      [breakpoints.md]: stylePropVars.fxDirection_md,
      [breakpoints.lg]: stylePropVars.fxDirection_lg,
      [breakpoints.xl]: stylePropVars.fxDirection_xl
    }
  }
})
