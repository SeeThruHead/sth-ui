import * as stylex from "@stylexjs/stylex"
import { Array as Arr, Effect, Option, Predicate, Queue, Schema, Stream } from "effect"
import type { Cause } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import * as Subscription from "foldkit/subscription"
import type { Child } from "../../content.ts"
import { magnitude, resolvePanel, working } from "../../hooks/splitter.ts"
import type { Frame, KeyMove, PaneSize } from "../../hooks/splitter.ts"
import type { ComponentConfig, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { themeColor } from "../../theme/accent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors } from "../../theme/tokens.stylex.ts"
import { frameOf, isDragging, Message, Orientation } from "./model.ts"
import type { Container, Model } from "./model.ts"
import { splitterVars } from "./Splitter.stylex.ts"
import { sizeValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setStyle, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"

export * from "./model.ts"

export type { PaneSize, Panel, RedistributeFn, RedistributeInput, ResolvedPanel } from "../../hooks/splitter.ts"

const dragCursors: { readonly [Name in Orientation]: string } = { horizontal: "col-resize", vertical: "row-resize" }

const offering =
  (queue: Queue.Queue<Message, Cause.Done>, toMessage: (event: PointerEvent) => Message) =>
  (event: PointerEvent): void => {
    Queue.offerUnsafe(queue, toMessage(event))
  }

const draggingDocument = (orientation: Orientation): Stream.Stream<Message> =>
  Stream.callback<Message>((queue) =>
    Effect.acquireRelease(
      Effect.sync(() => {
        const body = document.body.style
        const moved = offering(queue, (event) => Message.MovedPointer({ x: event.clientX, y: event.clientY }))
        const released = offering(queue, (event) => Message.ReleasedPointer({ x: event.clientX, y: event.clientY }))
        body.setProperty("user-select", "none")
        body.setProperty("-webkit-user-select", "none")
        body.setProperty("cursor", dragCursors[orientation])
        document.addEventListener("pointermove", moved)
        document.addEventListener("pointerup", released)
        document.addEventListener("pointercancel", released)

        return () => {
          document.removeEventListener("pointermove", moved)
          document.removeEventListener("pointerup", released)
          document.removeEventListener("pointercancel", released)
          body.removeProperty("user-select")
          body.removeProperty("-webkit-user-select")
          body.removeProperty("cursor")
        }
      }),
      (stop) => Effect.sync(stop)
    ).pipe(Effect.flatMap(() => Effect.never))
  )

export const subscriptions = Subscription.make<Model, Message>()((entry) => ({
  dragPointer: entry(
    { dragging: Schema.Boolean, orientation: Orientation },
    {
      modelToDependencies: (model) => ({ dragging: isDragging(model), orientation: model.orientation }),
      dependenciesToStream: ({ dragging, orientation }) =>
        Stream.when(
          draggingDocument(orientation),
          Effect.sync(() => dragging)
        )
    }
  )
}))

const rootFontSize = (): number => Number.parseFloat(getComputedStyle(document.documentElement).fontSize)

const containerOf = (element: Element): Container => {
  const box = element.getBoundingClientRect()

  return { width: box.width, height: box.height, rootFont: rootFontSize() }
}

const measuredRoot = (id: string): Option.Option<Container> =>
  Option.map(Option.fromNullishOr(document.getElementById(id)), containerOf)

const MeasureSplitter = Mount.defineStream("MeasureSplitter", {
  messages: [Message.MeasuredContainer],
  execute: ({ element }) =>
    Stream.callback<typeof Message.MeasuredContainer.Type>((queue) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const observer = new ResizeObserver(() => {
            Queue.offerUnsafe(queue, Message.MeasuredContainer({ container: containerOf(element) }))
          })
          observer.observe(element)

          return observer
        }),
        (observer) => Effect.sync(() => observer.disconnect())
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export type SplitterPart = "root" | "pane" | "handle" | "thumb"

export type SplitterOptions = {
  readonly lineSize?: number | string
  readonly handleColor?: string
  readonly withHandle?: boolean
}

export type SplitterProps<M> = SplitterOptions &
  StylesApiProps<SplitterPart> & {
    readonly model: Model
    readonly toParentMessage: (message: Message) => M
    readonly handleIcon?: Child
    readonly children: ReadonlyArray<Child>
  }

export type SplitterConfig = ComponentConfig<SplitterOptions, SplitterPart>

const styles = stylex.create({
  root: {
    [splitterVars.lineSize]: "0.125rem",
    [splitterVars.handleColor]: colors.body,
    display: "flex",
    flexDirection: "row"
  },
  vertical: { flexDirection: "column" },
  pane: { flexGrow: 0, flexShrink: 1, overflow: "auto" },
  handle: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: splitterVars.lineSize,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    touchAction: "none",
    outline: "none",
    backgroundColor: splitterVars.handleColor,
    cursor: "col-resize"
  },
  handleVertical: { cursor: "row-resize" },
  thumb: {
    position: "absolute",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "1000px",
    color: colors.dimmed,
    transition: "color 100ms ease",
    backgroundColor: `light-dark(${palette.white}, ${palette.dark6})`,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray3}, ${palette.dark4})`,
    width: "0.75rem",
    height: "3.75rem",
    boxShadow: { default: null, [stylex.when.ancestor(":focus-visible")]: `0 0 0 2px ${accent.filled}` }
  },
  thumbVertical: { width: "3.75rem", height: "0.75rem" },
  icon: { width: "100%", height: "100%" }
})

const grips: { readonly [Name in Orientation]: ReadonlyArray<string> } = {
  horizontal: ["M8 5", "M8 12", "M8 19", "M14 5", "M14 12", "M14 19"],
  vertical: ["M5 8", "M12 8", "M19 8", "M5 14", "M12 14", "M19 14"]
}

const grip = <M>(h: HtmlBuilder<M>, orientation: Orientation): Html =>
  h.svg(
    [
      ...sx(h, styles.icon),
      h.Attribute("viewBox", "0 0 24 24"),
      h.Attribute("fill", "none"),
      h.Attribute("stroke", "currentColor"),
      h.Attribute("stroke-width", "2"),
      h.Attribute("stroke-linecap", "round"),
      h.Attribute("stroke-linejoin", "round"),
      h.AriaHidden(true)
    ],
    grips[orientation].map((start) => h.path([h.Attribute("d", `${start}a1 1 0 1 0 2 0a1 1 0 1 0 -2 0`)], []))
  )

const paneStyle = (size: PaneSize, frame: Frame): Sx => {
  if (!frame.pixel) return setStyle(["flexBasis", `${magnitude(size)}%`])
  if (Predicate.isString(size) && !size.endsWith("%"))
    return setStyle(["flexGrow", "0"], ["flexShrink", "1"], ["flexBasis", size])

  return setStyle(["flexGrow", String(magnitude(size))], ["flexShrink", "1"], ["flexBasis", "0"])
}

const keyMoves: { readonly [Name in Orientation]: { readonly [key: string]: KeyMove } } = {
  horizontal: { ArrowLeft: "decrease", ArrowRight: "increase", Home: "home", End: "end", Enter: "toggle" },
  vertical: { ArrowUp: "decrease", ArrowDown: "increase", Home: "home", End: "end", Enter: "toggle" }
}

const flipped: { readonly [Name in KeyMove]: KeyMove } = {
  decrease: "increase",
  increase: "decrease",
  home: "home",
  end: "end",
  toggle: "toggle"
}

const keyMove = (model: Model, key: string): Option.Option<KeyMove> =>
  Option.map(Option.fromNullishOr(keyMoves[model.orientation][key]), (move) =>
    model.dir === "rtl" && key.startsWith("Arrow") ? flipped[move] : move
  )

export const Splitter =
  (config: { readonly Splitter?: SplitterConfig }) =>
  <M>(h: HtmlBuilder<M>, input: SplitterProps<M>): Html => {
    const props = withDefaults(config.Splitter, input)
    const getStyles = stylesApi<M, SplitterPart>(h, props, config.Splitter, "root")
    const { model, toParentMessage } = props
    const vertical = model.orientation === "vertical"
    const frame = frameOf(model)
    const values = working(model.sizes, frame)
    const panels = model.panels.map((panel) => resolvePanel(panel, frame))
    const activeHandle = model.drag._tag === "Dragging" ? model.drag.handle : -1
    const handle = (index: number): Html =>
      h.div(
        [
          ...getStyles("handle", styles.handle, vertical && styles.handleVertical, stylex.defaultMarker()),
          h.Role("separator"),
          h.AriaOrientation(model.orientation),
          h.AriaValuenow(Math.round(Arr.getUnsafe(values, index))),
          h.AriaValuemin(Math.round(Arr.getUnsafe(panels, index).min)),
          h.AriaValuemax(Math.round(Arr.getUnsafe(panels, index).max)),
          h.Tabindex(0),
          h.DataAttribute("orientation", model.orientation),
          ...(activeHandle === index ? [h.DataAttribute("active", "")] : []),
          h.OnPointerDown((_type, button, _screenX, _screenY, _time, x, y) =>
            button === 0
              ? Option.map(measuredRoot(model.id), (container) =>
                  toParentMessage(Message.PressedHandle({ handle: index, x, y, container }))
                )
              : Option.none()
          ),
          h.OnPointerUp(() => Option.some(toParentMessage(Message.ReleasedHandle()))),
          h.OnKeyDownPreventDefault((key, modifiers) =>
            Option.flatMap(keyMove(model, key), (move) =>
              Option.map(measuredRoot(model.id), (container) =>
                toParentMessage(Message.PressedKey({ handle: index, move, shift: modifiers.shiftKey, container }))
              )
            )
          ),
          h.OnDoubleClick(toParentMessage(Message.DoubleClickedHandle({ handle: index })))
        ],
        props.withHandle === false
          ? []
          : [
              h.div(
                [
                  ...getStyles("thumb", styles.thumb, vertical && styles.thumbVertical),
                  h.DataAttribute("orientation", model.orientation),
                  ...(activeHandle === index ? [h.DataAttribute("active", "")] : [])
                ],
                [props.handleIcon ?? grip(h, vertical ? "vertical" : "horizontal")]
              )
            ]
      )
    const pane = (child: Child, index: number): ReadonlyArray<Html> => {
      const size = Arr.getUnsafe(model.sizes, index)
      const paneView = h.div(
        [
          ...getStyles("pane", styles.pane, paneStyle(size, frame)),
          ...(magnitude(size) === 0 ? [h.DataAttribute("collapsed", "")] : [])
        ],
        [child]
      )

      return index === 0 ? [paneView] : [handle(index - 1), paneView]
    }

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          vertical && styles.vertical,
          setDefinedVars(
            [splitterVars.lineSize, mapDefined(props.lineSize, sizeValue)],
            [splitterVars.handleColor, mapDefined(props.handleColor, themeColor)]
          )
        ),
        h.Id(model.id),
        h.DataAttribute("orientation", model.orientation),
        h.OnMount(Mount.mapMessage(MeasureSplitter(), toParentMessage))
      ],
      props.children.flatMap(pane)
    )
  }
