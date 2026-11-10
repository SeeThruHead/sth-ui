import { Predicate } from "effect"
import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { ComponentConfig } from "../../styles/StylesApi.ts"
import { rem } from "../../theme/units.ts"
import { modalVars } from "./Modal.stylex.ts"
import type {
  Layout,
  ModalBaseConfig,
  ModalBaseOptions,
  ModalBasePart,
  ModalBaseProps,
  ModalFrameProps,
  ModalParts
} from "./ModalBase.ts"
import { radiusValue, sizeValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import { modalBase, modalFrame } from "./ModalBase.ts"

export {
  Message,
  Model,
  OutMessage,
  bodyId,
  close,
  init,
  open,
  stackClosed,
  stackOpened,
  stackZIndex,
  titleId,
  update
} from "./ModalBase.ts"
export type { ModalParts, Result } from "./ModalBase.ts"

export type ModalPart = ModalBasePart

export type ModalSize = keyof typeof sizes

export type ModalOptions = ModalBaseOptions & {
  readonly size?: ModalSize | number | (string & {})
  readonly centered?: boolean
  readonly fullScreen?: boolean
  readonly xOffset?: string | number
  readonly yOffset?: string | number
}

export type ModalProps<M> = ModalBaseProps<M> & ModalOptions

export type ModalConfig = ComponentConfig<ModalOptions, ModalPart>

const styles = stylex.create({
  root: { [modalVars.size]: "440px", [modalVars.yOffset]: "5dvh", [modalVars.xOffset]: "5vw" },
  inner: {
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: modalVars.yOffset,
    paddingBottom: modalVars.yOffset,
    paddingInline: modalVars.xOffset
  },
  centered: { alignItems: "center" },
  innerFull: { paddingTop: 0, paddingBottom: 0, paddingInline: 0 },
  content: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: modalVars.size,
    maxHeight: `calc(100dvh - ${modalVars.yOffset} * 2)`
  },
  contentFull: { flexBasis: "100%", maxHeight: "none", height: "100dvh", borderRadius: 0 },
  header: { borderStartStartRadius: modalVars.radius, borderStartEndRadius: modalVars.radius },
  headerFull: { borderStartStartRadius: 0, borderStartEndRadius: 0 }
})

const sizes = stylex.create({
  xs: { [modalVars.size]: "320px" },
  sm: { [modalVars.size]: "380px" },
  md: { [modalVars.size]: "440px" },
  lg: { [modalVars.size]: "620px" },
  xl: { [modalVars.size]: "780px" }
})

const isModalSize = (size: string): size is ModalSize => Object.hasOwn(sizes, size)

const sizeStyle = (size: ModalOptions["size"]) => {
  if (size === undefined) return null
  if (Predicate.isNumber(size)) return setVars([modalVars.size, rem(size)])

  return isModalSize(size) ? sizes[size] : setVars([modalVars.size, size])
}

const modalLayout = <M>(h: HtmlBuilder<M>, props: ModalOptions, config: ModalConfig | undefined): Layout<M> => {
  const full = props.fullScreen === true
  const centered = props.centered === true

  return {
    root: [
      styles.root,
      sizeStyle(props.size),
      setDefinedVars(
        [modalVars.xOffset, mapDefined(props.xOffset, sizeValue)],
        [modalVars.yOffset, mapDefined(props.yOffset, sizeValue)]
      )
    ],
    inner: [styles.inner, centered && styles.centered, full && styles.innerFull],
    content: [styles.content, full && styles.contentFull],
    header: [styles.header, full && styles.headerFull],
    attributes: [
      ...(centered ? [h.DataAttribute("centered", "")] : []),
      ...(full ? [h.DataAttribute("full-screen", "")] : [])
    ],
    transition: { duration: 200, transition: "fade-down", ...props.transitionProps },
    radius: full ? "0" : mapDefined(props.radius, radiusValue),
    config
  }
}

export const Modal = (config: ModalBaseConfig & { readonly Modal?: ModalConfig }) => {
  const base = modalBase(config)

  return <M>(h: HtmlBuilder<M>, input: ModalProps<M>): Html => {
    const props = withDefaults(config.Modal, input)

    return base(h, props, stylesApi<M, ModalPart>(h, props, config.Modal, "root"), modalLayout(h, props, config.Modal))
  }
}

export type ModalRootProps<M> = ModalFrameProps<M> &
  ModalOptions & {
    readonly children: (parts: ModalParts<M>) => ReadonlyArray<Html>
  }

export const ModalRoot = (config: ModalBaseConfig & { readonly Modal?: ModalConfig }) => {
  const frame = modalFrame(config)

  return <M>(h: HtmlBuilder<M>, input: ModalRootProps<M>): Html => {
    const props = withDefaults(config.Modal, input)

    return frame(
      h,
      props,
      stylesApi<M, ModalPart>(h, props, config.Modal, "root"),
      modalLayout(h, props, config.Modal),
      props.children,
      true
    )
  }
}
