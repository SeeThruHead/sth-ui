import * as stylex from "@stylexjs/stylex"
import { Function, Option } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { setStyle, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { shared } from "../../styles/shared.ts"
import { accent, fontSize, radius, space } from "../../theme/tokens.stylex.ts"
import { Carousel } from "../Carousel/Carousel.ts"
import type { CarouselConfig } from "../Carousel/Carousel.ts"
import { Collapse } from "../Collapse/Collapse.ts"
import type { CollapseConfig } from "../Collapse/Collapse.ts"
import { FocusTrap, FocusTrapInitialFocus } from "../FocusTrap/FocusTrap.ts"
import { Portal } from "../Portal/Portal.ts"
import type { PortalConfig } from "../Portal/Portal.ts"
import * as Transition from "../Transition/Transition.ts"
import { WatchImage, WatchLightbox, WatchSwipe } from "./gesture.ts"
import { canNext, canPrevious, carouselContext, gotCarousel, Message } from "./model.ts"
import type { LightboxContext, Model } from "./model.ts"
import { RevealThumbnail } from "./reveal.ts"
import { lightboxVars } from "./Lightbox.stylex.ts"
import { isZoomed, zoomTransform } from "./zoom.ts"

export type LightboxPart =
  | "root"
  | "overlay"
  | "content"
  | "toolbar"
  | "toolbarGroup"
  | "toolbarButton"
  | "counter"
  | "slides"
  | "slide"
  | "slideImage"
  | "slideVideo"
  | "navigation"
  | "navigationButton"
  | "caption"
  | "thumbnails"
  | "thumbnail"
  | "thumbnailImage"

type SlideCommon = {
  readonly thumbSrc?: string
  readonly caption?: Child
  readonly renderThumb?: (active: boolean) => Child
}

export type LightboxImageSlide = SlideCommon & {
  readonly type?: "image"
  readonly src: string
  readonly alt?: string
  readonly srcSet?: string
  readonly sizes?: string
  readonly loading?: "eager" | "lazy"
}

export type LightboxVideoTrack = {
  readonly src: string
  readonly kind?: string
  readonly srcLang?: string
  readonly label?: string
  readonly default?: boolean
}

export type LightboxVideoSlide = SlideCommon & {
  readonly type: "video"
  readonly src: string
  readonly label?: string
  readonly poster?: string
  readonly autoPlay?: boolean
  readonly tracks?: ReadonlyArray<LightboxVideoTrack>
}

export type LightboxCustomSlide = SlideCommon & {
  readonly type: "custom"
  readonly render: (active: boolean) => Child
}

export type LightboxSlideData = LightboxImageSlide | LightboxVideoSlide | LightboxCustomSlide

export type LightboxLabels = {
  readonly lightboxLabel: string
  readonly slideLabel: (index: number, total: number) => string
  readonly slidesLabel: string
  readonly previousSlideLabel: string
  readonly nextSlideLabel: string
  readonly thumbnailLabel: (index: number, total: number) => string
  readonly enterFullscreenLabel: string
  readonly exitFullscreenLabel: string
  readonly showThumbnailsLabel: string
  readonly hideThumbnailsLabel: string
  readonly downloadLabel: string
  readonly closeLabel: string
}

export const defaultLabels: LightboxLabels = {
  lightboxLabel: "Gallery",
  slideLabel: (index, total) => `Slide ${index} of ${total}`,
  slidesLabel: "Slides",
  previousSlideLabel: "Previous slide",
  nextSlideLabel: "Next slide",
  thumbnailLabel: (index) => `Go to slide ${index}`,
  enterFullscreenLabel: "Enter fullscreen",
  exitFullscreenLabel: "Exit fullscreen",
  showThumbnailsLabel: "Show thumbnails",
  hideThumbnailsLabel: "Hide thumbnails",
  downloadLabel: "Download",
  closeLabel: "Close"
}

export type LightboxToolbarItem<M> = {
  readonly key: string
  readonly icon: Child
  readonly label: string
  readonly onClick: M
  readonly position?: "left" | "right"
}

export type LightboxOptions = {
  readonly withDownload?: boolean
  readonly withNavigation?: boolean
  readonly closeOnClickOutside?: boolean
  readonly returnFocus?: boolean
  readonly withinPortal?: boolean
  readonly zIndex?: number | string
  readonly transitionDuration?: number
}

export type LightboxProps<M> = LightboxOptions &
  LightboxContext &
  StylesApiProps<LightboxPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly slides: ReadonlyArray<LightboxSlideData>
    readonly labels?: Partial<LightboxLabels>
    readonly toolbarItems?: (defaults: ReadonlyArray<LightboxToolbarItem<M>>) => ReadonlyArray<LightboxToolbarItem<M>>
  }

export type LightboxConfig = ComponentConfig<LightboxOptions, LightboxPart>

const styles = stylex.create({
  overlay: { position: "fixed", inset: 0, zIndex: lightboxVars.zIndex, backgroundColor: "rgba(0, 0, 0, 0.9)" },
  content: {
    position: "fixed",
    inset: 0,
    zIndex: lightboxVars.zIndex,
    display: "flex",
    flexDirection: "column",
    color: "white",
    outline: "none"
  },
  trap: { display: "contents" },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "56px",
    paddingInline: space.md,
    flexShrink: 0,
    zIndex: 1
  },
  toolbarGroup: { display: "flex", alignItems: "center", gap: space.xs, minWidth: "40px" },
  toolbarButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    padding: 0,
    borderWidth: 0,
    borderRadius: radius.sm,
    color: "white",
    cursor: "pointer",
    opacity: { default: 0.8, ":hover": 1 },
    backgroundColor: { default: "transparent", ":hover": "rgba(255, 255, 255, 0.1)" },
    transitionProperty: "opacity, background-color",
    transitionDuration: lightboxVars.duration
  },
  counter: { fontSize: fontSize.sm, color: "white", opacity: 0.8, userSelect: "none" },
  slides: { flexGrow: 1, flexShrink: 1, flexBasis: 0, position: "relative", overflow: "hidden", minHeight: 0 },
  slide: {
    position: "relative",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: space.md,
    boxSizing: "border-box"
  },
  backdrop: { position: "absolute", inset: 0 },
  slideImage: {
    position: "relative",
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    userSelect: "none",
    transitionProperty: "transform",
    transitionDuration: lightboxVars.duration,
    transitionTimingFunction: "ease"
  },
  zoomable: { touchAction: "none", cursor: "zoom-in" },
  zoomed: { cursor: { default: "grab", ":active": "grabbing" } },
  panning: { transitionProperty: "none" },
  slideVideo: { position: "relative", width: "100%", height: "100%", objectFit: "contain" },
  navigation: {
    position: "absolute",
    top: "50%",
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    boxSizing: "border-box",
    paddingInline: space.md,
    pointerEvents: "none",
    transform: "translateY(-50%)",
    zIndex: 1
  },
  navigationButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: "white",
    cursor: "pointer",
    pointerEvents: "all",
    opacity: { default: 0.7, ":hover": 1 },
    transitionProperty: "opacity",
    transitionDuration: lightboxVars.duration
  },
  inactive: { opacity: { default: 0.3, ":hover": 0.3 }, pointerEvents: "none" },
  caption: {
    textAlign: "center",
    paddingBlock: space.xs,
    paddingInline: space.md,
    fontSize: fontSize.sm,
    color: "white",
    opacity: 0.8,
    flexShrink: 0
  },
  thumbnails: { paddingInline: space.md, flexShrink: 0 },
  thumbnailsViewport: {
    width: "fit-content",
    maxWidth: "100%",
    marginInline: "auto",
    height: "100px",
    overflowX: "auto"
  },
  thumbnailsContainer: { display: "flex", gap: space.xs, height: "100%", alignItems: "center" },
  thumbnail: {
    flexGrow: 0,
    flexShrink: 0,
    width: "64px",
    height: "64px",
    borderRadius: radius.sm,
    overflow: "hidden",
    opacity: { default: 0.5, ":hover": 0.8 },
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "transparent",
    cursor: "pointer",
    padding: 0,
    backgroundColor: "transparent",
    transitionProperty: "opacity, border-color",
    transitionDuration: lightboxVars.duration
  },
  activeThumbnail: { opacity: { default: 1, ":hover": 1 }, borderColor: accent.filled },
  thumbnailImage: { width: "100%", height: "100%", objectFit: "cover", display: "block" }
})

const contentTransition: Transition.TransitionStyles = {
  common: { transformOrigin: "center center" },
  in: { opacity: "1", transform: "scale(1)" },
  out: { opacity: "0", transform: "scale(0.95)" },
  transitionProperty: "transform, opacity"
}

const icon = <M>(h: HtmlBuilder<M>, path: string): Html =>
  h.svg(
    [
      h.Attribute("viewBox", "0 0 24 24"),
      h.Attribute("width", "20"),
      h.Attribute("height", "20"),
      h.Attribute("fill", "currentColor"),
      h.AriaHidden(true)
    ],
    [h.path([h.Attribute("d", path)], [])]
  )

const chevron = <M>(h: HtmlBuilder<M>, points: string): Html =>
  h.svg(
    [
      h.Attribute("viewBox", "0 0 24 24"),
      h.Attribute("width", "36"),
      h.Attribute("height", "36"),
      h.Attribute("fill", "none"),
      h.Attribute("stroke", "currentColor"),
      h.Attribute("stroke-width", "2"),
      h.Attribute("stroke-linecap", "round"),
      h.Attribute("stroke-linejoin", "round"),
      h.AriaHidden(true)
    ],
    [h.polyline([h.Attribute("points", points)], [])]
  )

const paths = {
  enterFullscreen: "M3 3h6v2H5v4H3V3zm12 0h6v6h-2V5h-4V3zM3 15h2v4h4v2H3v-6zm18 0v6h-6v-2h4v-4h2z",
  exitFullscreen: "M9 3v6H3V7h4V3h2zm6 0h2v4h4v2h-6V3zM3 15h6v6H7v-4H3v-2zm12 0h6v2h-4v4h-2v-6z",
  thumbnails: "M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z",
  download: "M12 16l-6-6h4V4h4v6h4l-6 6zm-8 2h16v2H4v-2z",
  close:
    "M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7a1 1 0 0 0-1.4 1.4L10.6 12l-4.9 4.9a1 1 0 1 0 1.4 1.4L12 13.4l4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z"
}

const slideName = (slide: LightboxSlideData): string | undefined => {
  if (slide.type === "custom") return undefined

  return slide.type === "video" ? slide.label : slide.alt
}

const thumbSource = (slide: LightboxSlideData): string | undefined => {
  if (slide.thumbSrc !== undefined) return slide.thumbSrc
  if (slide.type === "custom") return undefined

  return slide.type === "video" ? slide.poster : slide.src
}

const downloadSource = (slide: LightboxSlideData | undefined): Option.Option<string> =>
  Option.flatMap(Option.fromNullishOr(slide), (found) =>
    found.type === "custom" ? Option.none() : Option.some(found.src)
  )

type Configs = {
  readonly Lightbox?: LightboxConfig
  readonly Carousel?: CarouselConfig
  readonly Collapse?: CollapseConfig
  readonly Portal?: PortalConfig
}

export const Lightbox = (config: Configs) => {
  const carousel = Carousel(config)
  const collapse = Collapse(config)
  const portal = Portal(config)

  return <M>(h: HtmlBuilder<M>, input: LightboxProps<M>): Html => {
    const props = withDefaults(config.Lightbox, input)
    const model = props.model
    if (!Transition.isVisible(model.transition)) return h.empty
    const getStyles = stylesApi<M, LightboxPart>(h, props, config.Lightbox, "root")
    const send = props.toParentMessage
    const labels = { ...defaultLabels, ...props.labels }
    const count = props.slides.length
    const current = props.slides[model.index]
    const duration = props.transitionDuration ?? 200
    const zoomOn = props.withZoom === true

    const optional = (name: string, value: string | undefined) =>
      value === undefined ? [] : [h.Attribute(name, value)]

    const button = (item: LightboxToolbarItem<M>) =>
      h.keyed("button")(
        item.key,
        [
          ...getStyles("toolbarButton", styles.toolbarButton, shared.focusRing),
          h.Type("button"),
          h.AriaLabel(item.label),
          h.OnClick(item.onClick)
        ],
        [item.icon]
      )

    const defaults: ReadonlyArray<LightboxToolbarItem<M>> = [
      ...(props.withThumbnails === true
        ? [
            {
              key: "thumbnails",
              icon: icon(h, paths.thumbnails),
              label: model.thumbnailsVisible ? labels.hideThumbnailsLabel : labels.showThumbnailsLabel,
              onClick: send(Message.ToggledThumbnails()),
              position: "left" as const
            }
          ]
        : []),
      ...(props.withFullscreen === true
        ? [
            {
              key: "fullscreen",
              icon: icon(h, model.fullscreen ? paths.exitFullscreen : paths.enterFullscreen),
              label: model.fullscreen ? labels.exitFullscreenLabel : labels.enterFullscreenLabel,
              onClick: send(Message.ToggledFullscreen())
            }
          ]
        : []),
      ...(props.withDownload === true
        ? Option.toArray(
            Option.map(downloadSource(current), (src) => ({
              key: "download",
              icon: icon(h, paths.download),
              label: labels.downloadLabel,
              onClick: send(Message.RequestedDownload({ src }))
            }))
          )
        : []),
      { key: "close", icon: icon(h, paths.close), label: labels.closeLabel, onClick: send(Message.Closed()) }
    ]
    const items = props.toolbarItems === undefined ? defaults : props.toolbarItems(defaults)

    const toolbar = h.div(getStyles("toolbar", styles.toolbar), [
      h.div(
        getStyles("toolbarGroup", styles.toolbarGroup),
        items.filter((item) => item.position === "left").map(button)
      ),
      h.span(
        [...getStyles("counter", styles.counter), h.AriaHidden(true)],
        [count > 0 ? `${model.index + 1} / ${count}` : ""]
      ),
      h.div(
        getStyles("toolbarGroup", styles.toolbarGroup),
        items.filter((item) => item.position !== "left").map(button)
      )
    ])

    const image = (slide: LightboxImageSlide, active: boolean): Html => {
      const zoomed = active && isZoomed(model.zoom)

      return h.keyed("img")(
        `${slide.src}-${active ? "active" : "idle"}`,
        [
          ...getStyles(
            "slideImage",
            styles.slideImage,
            zoomOn && styles.zoomable,
            zoomed && styles.zoomed,
            active && Option.isSome(model.pan) && styles.panning,
            active ? setStyle(["transform", zoomTransform(model.zoom)]) : null
          ),
          h.Src(slide.src),
          h.Alt(slide.alt ?? ""),
          ...optional("srcset", slide.srcSet),
          ...optional("sizes", slide.sizes),
          h.Attribute("loading", slide.loading ?? (active ? "eager" : "lazy")),
          h.Draggable(false),
          ...(zoomOn ? [h.DataAttribute("zoom-enabled", "")] : []),
          ...(zoomed ? [h.DataAttribute("zoomed", "")] : []),
          ...(active && zoomOn
            ? [h.OnClick(send(Message.ToggledZoom())), h.OnMount(Mount.mapMessage(WatchImage(), send))]
            : [])
        ],
        []
      )
    }

    const video = (slide: LightboxVideoSlide, active: boolean): Html =>
      h.keyed("video")(
        `${slide.src}-${active ? "active" : "idle"}`,
        [
          ...getStyles("slideVideo", styles.slideVideo),
          h.Src(slide.src),
          ...optional("poster", slide.poster),
          ...optional("aria-label", slide.label),
          ...(active && slide.autoPlay === true ? [h.Attribute("autoplay", "")] : []),
          ...(active ? [h.DataAttribute("active", "")] : []),
          h.Attribute("controls", ""),
          h.Attribute("playsinline", "")
        ],
        (slide.tracks ?? []).map((track) =>
          h.track([
            h.Src(track.src),
            h.Attribute("kind", track.kind ?? "subtitles"),
            ...optional("srclang", track.srcLang),
            ...optional("label", track.label),
            ...(track.default === true ? [h.Attribute("default", "")] : [])
          ])
        )
      )

    const slideContent = (slide: LightboxSlideData, active: boolean): Child => {
      if (slide.type === "custom") return slide.render(active)
      if (slide.type === "video") return video(slide, active)

      return image(slide, active)
    }

    const slideView = (slide: LightboxSlideData, index: number): ReadonlyArray<Child> => {
      const active = index === model.index

      return [
        h.div(
          [
            ...getStyles("slide", styles.slide),
            h.DataAttribute("lightbox-slide", ""),
            ...(active ? [] : [h.Attribute("inert", "")])
          ],
          [
            ...(props.closeOnClickOutside === true
              ? [h.div([...sx(h, styles.backdrop), h.OnClick(send(Message.Closed()))], [])]
              : []),
            slideContent(slide, active)
          ]
        )
      ]
    }

    const navigationButton = (direction: "previous" | "next") => {
      const enabled = direction === "next" ? canNext(model, props) : canPrevious(model, props)

      return h.button(
        [
          ...getStyles("navigationButton", styles.navigationButton, !enabled && styles.inactive, shared.focusRing),
          h.Type("button"),
          h.AriaLabel(direction === "next" ? labels.nextSlideLabel : labels.previousSlideLabel),
          ...(enabled ? [] : [h.AriaDisabled(true), h.DataAttribute("inactive", "")]),
          h.Tabindex(enabled ? 0 : -1),
          h.OnClick(send(direction === "next" ? Message.RequestedNext() : Message.RequestedPrevious()))
        ],
        [chevron(h, direction === "next" ? "9 18 15 12 9 6" : "15 18 9 12 15 6")]
      )
    }

    const thumbnail = (slide: LightboxSlideData, index: number) => {
      const active = index === model.index
      const source = thumbSource(slide)

      return h.keyed("button")(
        `thumb-${index}-${active ? "active" : "idle"}`,
        [
          ...getStyles("thumbnail", styles.thumbnail, active && styles.activeThumbnail, shared.focusRing),
          h.Type("button"),
          h.AriaLabel(labels.thumbnailLabel(index + 1, count)),
          ...(active
            ? [
                h.AriaCurrent("true"),
                h.DataAttribute("active", ""),
                h.OnMount(Mount.mapMessage(RevealThumbnail(), Function.absurd<M>))
              ]
            : []),
          h.OnClick(send(Message.RequestedSlide({ index })))
        ],
        thumbContent(slide, active, source)
      )
    }

    const thumbContent = (
      slide: LightboxSlideData,
      active: boolean,
      source: string | undefined
    ): ReadonlyArray<Child> => {
      if (slide.renderThumb !== undefined) return [slide.renderThumb(active)]
      if (source === undefined) return []

      return [
        h.img([
          ...getStyles("thumbnailImage", styles.thumbnailImage),
          h.Src(source),
          h.Alt(""),
          h.Attribute("loading", "lazy"),
          h.Draggable(false)
        ])
      ]
    }

    const caption = Option.match(Option.fromNullishOr(current?.caption), {
      onNone: () => [],
      onSome: (text) => [h.div(getStyles("caption", styles.caption), [text])]
    })

    const thumbnails =
      props.withThumbnails === true
        ? [
            collapse(h, {
              expanded: model.thumbnailsVisible,
              transitionDuration: duration,
              keepMounted: false,
              styles: { root: [styles.thumbnails] },
              children: [
                h.div(sx(h, styles.thumbnailsViewport), [
                  h.div(sx(h, styles.thumbnailsContainer), props.slides.map(thumbnail))
                ])
              ]
            })
          ]
        : []

    const slides = h.div(
      [...getStyles("slides", styles.slides), h.OnMount(Mount.mapMessage(WatchSwipe(), send))],
      [
        carousel(h, {
          ...carouselContext(props),
          model: model.carousel,
          toParentMessage: (message) => send(gotCarousel(message)),
          height: "100%",
          withControls: false,
          withIndicators: false,
          withKeyboardEvents: false,
          draggable: !isZoomed(model.zoom),
          ariaLabel: labels.slidesLabel,
          statusLabel: (index, total) =>
            Option.match(
              Option.flatMap(Option.fromNullishOr(props.slides[index - 1]), (slide) =>
                Option.fromNullishOr(slideName(slide))
              ),
              {
                onNone: () => labels.slideLabel(index, total),
                onSome: (name) => `${labels.slideLabel(index, total)}: ${name}`
              }
            ),
          slideLabel: (index, total) => labels.slideLabel(index, total),
          slides: props.slides.map(slideView)
        }),
        ...((props.withNavigation ?? true)
          ? [
              h.div(getStyles("navigation", styles.navigation), [
                navigationButton("previous"),
                navigationButton("next")
              ])
            ]
          : [])
      ]
    )

    const root = h.div(
      [
        ...getStyles(
          "root",
          setVars(
            [lightboxVars.zIndex, props.zIndex === undefined ? "400" : String(props.zIndex)],
            [lightboxVars.duration, `${duration}ms`]
          )
        ),
        ...(model.transition.isShowing ? [h.DataAttribute("opened", "")] : []),
        h.DataAttribute("lock-scroll", ""),
        h.OnMount(Mount.mapMessage(WatchLightbox(), send))
      ],
      [
        h.div(
          getStyles(
            "overlay",
            styles.overlay,
            Transition.transitionStyle(model.transition, { transition: "fade", duration })
          ),
          []
        ),
        FocusTrap(h, {
          active: model.transition.isShowing,
          returnFocus: props.returnFocus ?? true,
          styles: { root: [styles.trap] },
          children: [
            h.div(
              [
                ...getStyles(
                  "content",
                  styles.content,
                  Transition.transitionStyle(model.transition, {
                    transition: contentTransition,
                    duration,
                    timingFunction: "ease"
                  })
                ),
                ...Transition.transitionAttributes(h, model.transition),
                h.Role("dialog"),
                h.AriaModal(true),
                h.AriaLabel(labels.lightboxLabel),
                h.Tabindex(-1)
              ],
              [FocusTrapInitialFocus(h), toolbar, slides, ...caption, ...thumbnails]
            )
          ]
        })
      ]
    )

    return (props.withinPortal ?? true) ? portal(h, { children: [root] }) : root
  }
}
