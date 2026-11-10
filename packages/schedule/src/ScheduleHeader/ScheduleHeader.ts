import * as stylex from "@stylexjs/stylex"
import { Effect, Function, Option, Schema, Stream } from "effect"
import * as Mount from "foldkit/mount"
import type { Attribute, Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "@sth-ui/core/content.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { stylesApi, sx } from "@sth-ui/core/styles/StylesApi.ts"
import type { StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { accent, colors, fontSize, fontWeight, radius } from "@sth-ui/core/theme/tokens.stylex.ts"
import type { ScheduleViewLevel } from "../events.ts"
import type { ScheduleLabels } from "../labels.ts"
import { tabTarget } from "./keys.ts"

export type ScheduleHeaderPart = "header" | "headerControl" | "viewSelect"

export type ScheduleHeaderProps<M> = StylesApiProps<ScheduleHeaderPart> & {
  readonly view: ScheduleViewLevel
  readonly title: Child
  readonly labels: ScheduleLabels
  readonly onPrevious?: M
  readonly onNext?: M
  readonly onToday?: M
  readonly onViewChange?: (view: ScheduleViewLevel) => M
  readonly views?: ReadonlyArray<ScheduleViewLevel>
  readonly onAgendaClick?: M
  readonly agendaActive?: boolean
  readonly previousControlProps?: ReadonlyArray<Attribute<M>>
  readonly nextControlProps?: ReadonlyArray<Attribute<M>>
  readonly todayControlProps?: ReadonlyArray<Attribute<M>>
  readonly viewSelectProps?: ReadonlyArray<Attribute<M>>
}

const styles = stylex.create({
  header: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px", alignItems: "center" },
  group: { display: "flex", gap: "8px", alignItems: "center" },
  control: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "default",
    userSelect: "none",
    minWidth: "32px",
    height: "32px",
    paddingInline: "12px",
    boxSizing: "border-box",
    borderRadius: radius.default,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: colors.defaultBorder,
    color: colors.defaultColor,
    backgroundColor: colors.default,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    textTransform: "capitalize"
  },
  square: { paddingInline: 0 },
  interactive: { cursor: "pointer", backgroundColor: { default: colors.default, ":hover": colors.defaultHover } },
  active: {
    backgroundColor: { default: accent.filled, ":hover": accent.filledHover },
    borderColor: { default: accent.filled, ":hover": accent.filledHover },
    color: accent.contrast
  },
  title: { minWidth: "140px" },
  viewSelect: { display: "flex", gap: "4px", marginInlineStart: "auto" }
})

const chevron = <M>(h: HtmlBuilder<M>, rotate: number): Html =>
  h.svg(
    [
      h.Attribute("viewBox", "0 0 15 15"),
      h.Attribute("width", "16"),
      h.Attribute("height", "16"),
      h.AriaHidden(true),
      h.Style({ transform: `rotate(${rotate}deg)` })
    ],
    [
      h.path(
        [
          h.Attribute(
            "d",
            "M8.84182 3.13514C9.04327 3.32401 9.05348 3.64042 8.86462 3.84188L5.43521 7.49991L8.86462 11.1579C9.05348 11.3594 9.04327 11.6758 8.84182 11.8647C8.64036 12.0535 8.32394 12.0433 8.13508 11.8419L4.38508 7.84188C4.20477 7.64955 4.20477 7.35027 4.38508 7.15794L8.13508 3.15794C8.32394 2.95648 8.64036 2.94628 8.84182 3.13514Z"
          ),
          h.Attribute("fill", "currentColor")
        ],
        []
      )
    ]
  )

const views: ReadonlyArray<ScheduleViewLevel> = ["day", "week", "month", "year"]

export const resourceViews: ReadonlyArray<ScheduleViewLevel> = ["day", "week", "month"]

const switchLabels = {
  day: "switchToDayView",
  week: "switchToWeekView",
  month: "switchToMonthView",
  year: "switchToYearView"
} as const

const isButton = (element: Element): element is HTMLButtonElement => element instanceof HTMLButtonElement

const tabKeys = (list: Element) => (event: KeyboardEvent) => {
  const tabs = Array.from(list.querySelectorAll("[role=tab]")).filter(isButton)
  const index = tabs.findIndex((tab) => tab === event.target)
  if (index === -1) return
  const rtl = getComputedStyle(list).direction === "rtl"
  Option.map(
    Option.flatMap(tabTarget(event.key, index, tabs.length, rtl), (target) => Option.fromNullishOr(tabs[target])),
    (tab) => {
      event.preventDefault()
      tab.focus()
    }
  )
}

const TabKeys = Mount.defineStream("ScheduleViewTabs", {
  messages: [Schema.Never],
  execute: ({ element }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const listener = tabKeys(element)
          element.ownerDocument.addEventListener("keydown", listener)

          return () => element.ownerDocument.removeEventListener("keydown", listener)
        }),
        (release) => Effect.sync(release)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const ScheduleHeader = <M>(h: HtmlBuilder<M>, props: ScheduleHeaderProps<M>): Html => {
  const getStyles = stylesApi<M, ScheduleHeaderPart>(h, props, undefined, "header")
  const control = (
    label: string,
    message: M | undefined,
    children: ReadonlyArray<Child>,
    extra: ReadonlyArray<Attribute<M>> = [],
    square = false
  ) =>
    h.button(
      [
        ...getStyles(
          "headerControl",
          styles.control,
          square && styles.square,
          message !== undefined && styles.interactive,
          shared.focusRing
        ),
        h.Type("button"),
        h.AriaLabel(label),
        ...(message === undefined ? [] : [h.DataAttribute("interactive", ""), h.OnClick(message)]),
        ...extra
      ],
      children
    )
  const viewControl = (view: ScheduleViewLevel) => {
    const selected = view === props.view

    return h.button(
      [
        ...getStyles("headerControl", styles.control, styles.interactive, selected && styles.active, shared.focusRing),
        h.Type("button"),
        h.Role("tab"),
        h.AriaSelected(selected),
        h.Tabindex(selected ? 0 : -1),
        h.AriaLabel(props.labels[switchLabels[view]]),
        h.DataAttribute("type", view),
        ...(selected ? [h.DataAttribute("active", "")] : []),
        ...(props.onViewChange === undefined ? [] : [h.OnClick(props.onViewChange(view))])
      ],
      [props.labels[view]]
    )
  }

  return h.div(getStyles("header", styles.header), [
    h.div(sx(h, styles.group), [
      control(props.labels.previous, props.onPrevious, [chevron(h, 0)], props.previousControlProps, true),
      h.div([...getStyles("headerControl", styles.control, styles.title), h.AriaLive("polite")], [props.title]),
      control(props.labels.next, props.onNext, [chevron(h, 180)], props.nextControlProps, true)
    ]),
    control(props.labels.today, props.onToday, [props.labels.today], props.todayControlProps),
    ...(props.onAgendaClick === undefined
      ? []
      : [
          h.button(
            [
              ...getStyles(
                "headerControl",
                styles.control,
                styles.interactive,
                props.agendaActive === true && styles.active,
                shared.focusRing
              ),
              h.Type("button"),
              h.DataAttribute("type", "agenda"),
              h.AriaPressed(String(props.agendaActive === true)),
              ...(props.agendaActive === true ? [h.DataAttribute("active", "")] : []),
              h.OnClick(props.onAgendaClick)
            ],
            [props.labels.agenda]
          )
        ]),
    h.div(
      [
        ...getStyles("viewSelect", styles.viewSelect),
        h.Role("tablist"),
        h.AriaLabel(props.labels.viewSelectLabel),
        h.OnMount(Mount.mapMessage(TabKeys(), Function.absurd<M>)),
        ...(props.viewSelectProps ?? [])
      ],
      (props.views ?? views).map(viewControl)
    )
  ])
}
