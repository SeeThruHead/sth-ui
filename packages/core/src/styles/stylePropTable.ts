export type StylePropKind =
  | "spacing"
  | "size"
  | "color"
  | "textColor"
  | "radius"
  | "fontFamily"
  | "fontSize"
  | "lineHeight"
  | "identity"
  | "border"

export const responsiveTable = {
  m: ["spacing", "margin"],
  mt: ["spacing", "marginTop"],
  mb: ["spacing", "marginBottom"],
  ml: ["spacing", "marginLeft"],
  mr: ["spacing", "marginRight"],
  ms: ["spacing", "marginInlineStart"],
  me: ["spacing", "marginInlineEnd"],
  mx: ["spacing", "marginInline"],
  my: ["spacing", "marginBlock"],
  p: ["spacing", "padding"],
  pt: ["spacing", "paddingTop"],
  pb: ["spacing", "paddingBottom"],
  pl: ["spacing", "paddingLeft"],
  pr: ["spacing", "paddingRight"],
  ps: ["spacing", "paddingInlineStart"],
  pe: ["spacing", "paddingInlineEnd"],
  px: ["spacing", "paddingInline"],
  py: ["spacing", "paddingBlock"],
  bdrs: ["radius", "borderRadius"],
  c: ["textColor", "color"],
  opacity: ["identity", "opacity"],
  ff: ["fontFamily", "fontFamily"],
  fz: ["fontSize", "fontSize"],
  fw: ["identity", "fontWeight"],
  lts: ["size", "letterSpacing"],
  ta: ["identity", "textAlign"],
  lh: ["lineHeight", "lineHeight"],
  fs: ["identity", "fontStyle"],
  tt: ["identity", "textTransform"],
  td: ["identity", "textDecoration"],
  w: ["spacing", "width"],
  miw: ["spacing", "minWidth"],
  maw: ["spacing", "maxWidth"],
  h: ["spacing", "height"],
  mih: ["spacing", "minHeight"],
  mah: ["spacing", "maxHeight"],
  bgsz: ["size", "backgroundSize"],
  bgp: ["identity", "backgroundPosition"],
  bgr: ["identity", "backgroundRepeat"],
  bga: ["identity", "backgroundAttachment"],
  pos: ["identity", "position"],
  top: ["size", "top"],
  left: ["size", "left"],
  bottom: ["size", "bottom"],
  right: ["size", "right"],
  inset: ["size", "inset"],
  display: ["identity", "display"],
  flex: ["identity", "flex"]
} satisfies { readonly [name: string]: readonly [StylePropKind, string] }

export const flexTable = {
  fxGap: ["spacing", "gap"],
  fxRowGap: ["spacing", "rowGap"],
  fxColumnGap: ["spacing", "columnGap"],
  fxAlign: ["identity", "alignItems"],
  fxJustify: ["identity", "justifyContent"],
  fxWrap: ["identity", "flexWrap"],
  fxDirection: ["identity", "flexDirection"]
} satisfies { readonly [name: string]: readonly [StylePropKind, string] }

export const inlineTable = {
  bd: ["border", "border"],
  bg: ["color", "background"]
} satisfies { readonly [name: string]: readonly [StylePropKind, string] }

export const breakpointNames: ReadonlyArray<"xs" | "sm" | "md" | "lg" | "xl"> = ["xs", "sm", "md", "lg", "xl"]
