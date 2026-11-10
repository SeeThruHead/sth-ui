import * as stylex from "@stylexjs/stylex"
import type { Attribute, ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import { Popover } from "@sth-ui/core/components/Popover/Popover.ts"
import type { Model as PopoverModel, Message as PopoverMessage } from "@sth-ui/core/components/Popover/Popover.ts"
import type { Child } from "@sth-ui/core/content.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { setStyle, stylesApi } from "@sth-ui/core/styles/StylesApi.ts"
import type { StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { colors, fontWeight } from "@sth-ui/core/theme/tokens.stylex.ts"
import type { ScheduleEvent as EventData } from "../events.ts"
import type { ScheduleLabels } from "../labels.ts"
import { ScheduleEvent } from "../ScheduleEvent/ScheduleEvent.ts"
import type { RenderEvent } from "../ScheduleEvent/ScheduleEvent.ts"

export type MoreEventsPart = "moreEventsButton" | "moreEventsList"

export type MoreEventsProps<M> = StylesApiProps<MoreEventsPart> & {
  readonly events: ReadonlyArray<EventData>
  readonly moreEventsCount: number
  readonly labels: ScheduleLabels
  readonly static?: boolean
  readonly renderEventBody?: ((event: EventData) => Child) | undefined
  readonly renderEvent?: RenderEvent<M> | undefined
  readonly onEventClick?: ((event: EventData) => M) | undefined
  readonly onOpen?: M
  readonly popover?: { readonly model: PopoverModel; readonly toParentMessage: (message: PopoverMessage) => M }
}

const styles = stylex.create({
  button: {
    color: { default: colors.dimmed, ":hover": colors.bright },
    textDecoration: { default: "none", ":hover": "underline" },
    fontSize: "13px",
    fontWeight: fontWeight.medium,
    fontFamily: "inherit",
    pointerEvents: "all",
    flexGrow: 1,
    background: "none",
    borderWidth: 0,
    padding: 0,
    textAlign: "start",
    cursor: "pointer"
  },
  still: { cursor: "default", color: { default: colors.dimmed, ":hover": colors.dimmed }, textDecoration: "none" },
  list: { display: "flex", flexDirection: "column", gap: "4px", padding: "4px" }
})

const popover = Popover({})

export const MoreEvents = <M>(h: HtmlBuilder<M>, props: MoreEventsProps<M>): Html => {
  const getStyles = stylesApi<M, MoreEventsPart>(h, props, undefined, "moreEventsButton")
  const label = props.labels.moreLabel(props.moreEventsCount)
  const isStatic = props.static === true
  const button = (bind: ReadonlyArray<ChildAttribute>, extra: ReadonlyArray<Attribute<M>> = []) =>
    h.button(
      [
        ...stylesApi<M, MoreEventsPart>(h, { ...props, bind }, undefined, "moreEventsButton")(
          "moreEventsButton",
          styles.button,
          isStatic && styles.still,
          shared.focusRing
        ),
        h.Type("button"),
        ...(isStatic ? [h.DataAttribute("static", "")] : []),
        ...extra
      ],
      [label]
    )
  const list = h.div(
    getStyles("moreEventsList", styles.list),
    props.events.map((event) =>
      ScheduleEvent(h, {
        event,
        size: "md",
        static: isStatic,
        renderEventBody: props.renderEventBody,
        renderEvent: props.renderEvent,
        ...(props.onEventClick === undefined ? {} : { onClick: props.onEventClick(event) }),
        layout: setStyle(["flexShrink", "0"])
      })
    )
  )
  if (isStatic) return button([])
  if (props.popover === undefined) return button([], props.onOpen === undefined ? [] : [h.OnClick(props.onOpen)])

  return popover(h, {
    model: props.popover.model,
    toParentMessage: props.popover.toParentMessage,
    position: "bottom-start",
    width: 260,
    offset: -46,
    target: button,
    children: [list]
  })
}
