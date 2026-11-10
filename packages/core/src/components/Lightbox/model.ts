import { Option, Schema } from "effect"
import * as Command from "foldkit/command"
import { defineMessageUnion } from "foldkit/message"
import * as Carousel from "../Carousel/model.ts"
import * as Transition from "../Transition/model.ts"
import { Download, EnterFullscreen, ExitFullscreen } from "./commands.ts"
import { isZoomed, panBy, toggleZoom, unzoomed, zoomAt } from "./zoom.ts"
import type { Size } from "./zoom.ts"

const ZoomState = Schema.Struct({ scale: Schema.Finite, x: Schema.Finite, y: Schema.Finite })

const SizeSchema = Schema.Struct({ width: Schema.Finite, height: Schema.Finite })

const Pan = Schema.Struct({
  x: Schema.Finite,
  y: Schema.Finite,
  fromX: Schema.Finite,
  fromY: Schema.Finite,
  moved: Schema.Boolean
})

export const Model = Schema.Struct({
  id: Schema.String,
  transition: Transition.Model,
  carousel: Carousel.Model,
  index: Schema.Int,
  thumbnailsVisible: Schema.Boolean,
  zoom: ZoomState,
  imageSize: SizeSchema,
  pan: Schema.Option(Pan),
  fullscreen: Schema.Boolean,
  ownsFullscreen: Schema.Boolean
})
export type Model = typeof Model.Type

export const Message = defineMessageUnion({
  Opened: { index: Schema.Int },
  Closed: {},
  RequestedNext: {},
  RequestedPrevious: {},
  RequestedSlide: { index: Schema.Int },
  ToggledThumbnails: {},
  ToggledZoom: {},
  ToggledFullscreen: {},
  RequestedDownload: { src: Schema.String },
  PressedKey: { key: Schema.String },
  Wheeled: { deltaY: Schema.Finite, offsetX: Schema.Finite, offsetY: Schema.Finite },
  PanStarted: { x: Schema.Finite, y: Schema.Finite },
  PanMoved: { x: Schema.Finite, y: Schema.Finite },
  PanEnded: {},
  MeasuredImage: { size: SizeSchema },
  FullscreenChanged: { fullscreen: Schema.Boolean },
  SwipedDown: {},
  GotCarousel: { message: Carousel.Message },
  GotTransition: { message: Transition.Message },
  CompletedCommand: {}
})
export type Message = typeof Message.Type

export const OutMessage = defineMessageUnion({
  IndexChanged: { index: Schema.Int },
  LightboxOpened: {},
  LightboxClosed: {}
})
export type OutMessage = typeof OutMessage.Type

export type LightboxContext = {
  readonly slideCount: number
  readonly loop?: boolean
  readonly withZoom?: boolean
  readonly withThumbnails?: boolean
  readonly withFullscreen?: boolean
  readonly zoomMaxScale?: number
  readonly closeOnSwipeDown?: boolean
  readonly withKeyboardEvents?: boolean
  readonly withSlideTransition?: boolean
}

export type Result = {
  readonly model: Model
  readonly commands: ReadonlyArray<Command.Command<Message>>
  readonly outMessages: ReadonlyArray<OutMessage>
}

export const carouselContext = (context: LightboxContext): Carousel.CarouselContext => ({
  loop: context.loop === true,
  duration: context.withSlideTransition === true ? 300 : 1
})

export const init = (config: { readonly id: string; readonly withThumbnails?: boolean }): Model => ({
  id: config.id,
  transition: Transition.init({ id: `${config.id}-content`, mounted: false }),
  carousel: Carousel.init({ id: `${config.id}-slides` }),
  index: 0,
  thumbnailsVisible: config.withThumbnails === true,
  zoom: unzoomed,
  imageSize: { width: 0, height: 0 },
  pan: Option.none(),
  fullscreen: false,
  ownsFullscreen: false
})

export const gotCarousel = (message: Carousel.Message): Message => Message.GotCarousel({ message })

export const gotTransition = (message: Transition.Message): Message => Message.GotTransition({ message })

export const completedCommand = (): Message => Message.CompletedCommand()

export const isOpened = (model: Model): boolean => model.transition.isShowing

const none = (model: Model): Result => ({ model, commands: [], outMessages: [] })

const clampIndex = (index: number, count: number) => Math.max(0, Math.min(Math.round(index), Math.max(0, count - 1)))

const fromCarousel = (model: Model, result: Carousel.Result): Result => {
  const changed = result.outMessages.flatMap((out) => (out._tag === "SlideChanged" ? [out.index] : []))
  const commands = result.commands.map((command) => Command.mapMessage(command, gotCarousel))

  return changed.reduce<Result>(
    (state, index) => ({
      model: { ...state.model, index, zoom: unzoomed, pan: Option.none() },
      commands: state.commands,
      outMessages: [...state.outMessages, OutMessage.IndexChanged({ index })]
    }),
    { model: { ...model, carousel: result.model }, commands, outMessages: [] }
  )
}

const carouselStep = (model: Model, message: Carousel.Message, context: LightboxContext): Result =>
  fromCarousel(model, Carousel.update(model.carousel, message, carouselContext(context)))

const fromTransition = (model: Model, result: Transition.Result, outs: ReadonlyArray<OutMessage>): Result => ({
  model: { ...model, transition: result.model },
  commands: Transition.liftCommands(result.commands, gotTransition),
  outMessages: outs
})

const opened = (model: Model, index: number, context: LightboxContext): Result => {
  const start = clampIndex(index, context.slideCount)

  return fromTransition(
    { ...model, index: start, carousel: { ...Carousel.init({ id: model.carousel.id }), index: start } },
    Transition.mounted(model.transition, true),
    [OutMessage.LightboxOpened()]
  )
}

const closed = (model: Model, context: LightboxContext): Result => {
  const hidden = fromTransition(
    {
      ...model,
      zoom: unzoomed,
      pan: Option.none(),
      thumbnailsVisible: context.withThumbnails === true,
      ownsFullscreen: false
    },
    Transition.mounted(model.transition, false),
    [OutMessage.LightboxClosed()]
  )

  return model.ownsFullscreen
    ? { ...hidden, commands: [...hidden.commands, Command.mapMessage(ExitFullscreen(), completedCommand)] }
    : hidden
}

const zoomEnabled = (context: LightboxContext) => context.withZoom === true

const toggledZoom = (model: Model, context: LightboxContext): Result =>
  zoomEnabled(context) ? none({ ...model, zoom: toggleZoom(model.zoom, context.zoomMaxScale ?? 3) }) : none(model)

const panned = (model: Model, dx: number, dy: number, size: Size): Model => ({
  ...model,
  zoom: panBy(model.zoom, dx, dy, size)
})

const fullscreenToggled = (model: Model): Result =>
  model.fullscreen
    ? {
        model: { ...model, ownsFullscreen: false },
        commands: [Command.mapMessage(ExitFullscreen(), completedCommand)],
        outMessages: []
      }
    : {
        model: { ...model, ownsFullscreen: true },
        commands: [Command.mapMessage(EnterFullscreen(), completedCommand)],
        outMessages: []
      }

const step = 50

const arrow = (
  model: Model,
  context: LightboxContext,
  pan: { readonly dx: number; readonly dy: number },
  move: Option.Option<Carousel.Message>
): Result => {
  if (isZoomed(model.zoom)) return none(panned(model, pan.dx, pan.dy, model.imageSize))

  return Option.match(move, { onNone: () => none(model), onSome: (message) => carouselStep(model, message, context) })
}

const pressed = (model: Model, key: string, context: LightboxContext): Result => {
  if (key === "Escape") return closed(model, context)
  if (context.withKeyboardEvents === false) return none(model)
  if (key === "ArrowLeft") return arrow(model, context, { dx: step, dy: 0 }, Option.some(Carousel.previous()))
  if (key === "ArrowRight") return arrow(model, context, { dx: -step, dy: 0 }, Option.some(Carousel.next()))
  if (key === "ArrowUp") return arrow(model, context, { dx: 0, dy: step }, Option.none())
  if (key === "ArrowDown") return arrow(model, context, { dx: 0, dy: -step }, Option.none())

  return toggleByKey(model, key.toLowerCase(), context)
}

const toggleByKey = (model: Model, key: string, context: LightboxContext): Result => {
  if (key === "f" && context.withFullscreen === true) return fullscreenToggled(model)
  if (key === "t" && context.withThumbnails === true)
    return none({ ...model, thumbnailsVisible: !model.thumbnailsVisible })
  if (key === "z") return toggledZoom(model, context)

  return none(model)
}

const panMoved = (model: Model, x: number, y: number): Result =>
  Option.match(model.pan, {
    onNone: () => none(model),
    onSome: (pan) => {
      const moved = pan.moved || Math.abs(x - pan.x) > 3 || Math.abs(y - pan.y) > 3
      const zoom = panBy({ ...model.zoom, x: pan.fromX, y: pan.fromY }, x - pan.x, y - pan.y, model.imageSize)

      return none({ ...model, zoom, pan: Option.some({ ...pan, moved }) })
    }
  })

export const update = (model: Model, message: Message, context: LightboxContext): Result =>
  Message.match(message, {
    Opened: ({ index }) => opened(model, index, context),
    Closed: () => closed(model, context),
    RequestedNext: () => carouselStep(model, Carousel.next(), context),
    RequestedPrevious: () => carouselStep(model, Carousel.previous(), context),
    RequestedSlide: ({ index }) => carouselStep(model, Carousel.scrollToSlide(index), context),
    ToggledThumbnails: () => none({ ...model, thumbnailsVisible: !model.thumbnailsVisible }),
    ToggledZoom: () =>
      Option.exists(model.pan, (pan) => pan.moved)
        ? none({ ...model, pan: Option.none() })
        : toggledZoom(model, context),
    ToggledFullscreen: () => fullscreenToggled(model),
    RequestedDownload: ({ src }) => ({
      model,
      commands: [Command.mapMessage(Download({ src }), completedCommand)],
      outMessages: []
    }),
    PressedKey: ({ key }) => (isOpened(model) ? pressed(model, key, context) : none(model)),
    Wheeled: ({ deltaY, offsetX, offsetY }) =>
      zoomEnabled(context)
        ? none({
            ...model,
            zoom: zoomAt(model.zoom, deltaY > 0 ? -0.2 : 0.2, context.zoomMaxScale ?? 3, model.imageSize, {
              x: offsetX,
              y: offsetY
            })
          })
        : none(model),
    PanStarted: ({ x, y }) =>
      isZoomed(model.zoom)
        ? none({ ...model, pan: Option.some({ x, y, fromX: model.zoom.x, fromY: model.zoom.y, moved: false }) })
        : none(model),
    PanMoved: ({ x, y }) => panMoved(model, x, y),
    PanEnded: () => none(Option.exists(model.pan, (pan) => pan.moved) ? model : { ...model, pan: Option.none() }),
    MeasuredImage: ({ size }) => none({ ...model, imageSize: size }),
    FullscreenChanged: ({ fullscreen }) =>
      none({ ...model, fullscreen, ownsFullscreen: fullscreen ? model.ownsFullscreen : false }),
    SwipedDown: () =>
      context.closeOnSwipeDown === false || isZoomed(model.zoom) ? none(model) : closed(model, context),
    GotCarousel: ({ message: inner }) => carouselStep(model, inner, context),
    GotTransition: ({ message: inner }) => fromTransition(model, Transition.update(model.transition, inner), []),
    CompletedCommand: () => none(model)
  })

export const open = (index = 0): Message => Message.Opened({ index })

export const close = (): Message => Message.Closed()

export const canPrevious = (model: Model, context: LightboxContext): boolean =>
  context.loop === true ? context.slideCount > 1 : model.index > 0

export const canNext = (model: Model, context: LightboxContext): boolean =>
  context.loop === true ? context.slideCount > 1 : model.index < context.slideCount - 1
