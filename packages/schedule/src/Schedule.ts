import { AgendaView } from "./AgendaView/AgendaView.ts"
import type { AgendaViewConfig } from "./AgendaView/AgendaView.ts"
import { DayView } from "./DayView/DayView.ts"
import type { DayViewConfig } from "./DayView/DayView.ts"
import { MobileMonthView } from "./MobileMonthView/MobileMonthView.ts"
import type { MobileMonthViewConfig } from "./MobileMonthView/MobileMonthView.ts"
import { MonthView } from "./MonthView/MonthView.ts"
import type { MonthViewConfig } from "./MonthView/MonthView.ts"
import { ResourcesDayView } from "./ResourcesDayView/ResourcesDayView.ts"
import type { ResourcesDayViewConfig } from "./ResourcesDayView/ResourcesDayView.ts"
import { ResourcesMonthView } from "./ResourcesMonthView/ResourcesMonthView.ts"
import type { ResourcesMonthViewConfig } from "./ResourcesMonthView/ResourcesMonthView.ts"
import { ResourcesSchedule } from "./ResourcesSchedule/ResourcesSchedule.ts"
import type { ResourcesScheduleConfig } from "./ResourcesSchedule/ResourcesSchedule.ts"
import { ResourcesWeekView } from "./ResourcesWeekView/ResourcesWeekView.ts"
import type { ResourcesWeekViewConfig } from "./ResourcesWeekView/ResourcesWeekView.ts"
import { Schedule } from "./Schedule/Schedule.ts"
import type { ScheduleConfig as ScheduleComponentConfig } from "./Schedule/Schedule.ts"
import { ScheduleEvent } from "./ScheduleEvent/ScheduleEvent.ts"
import { WeekView } from "./WeekView/WeekView.ts"
import { YearView } from "./YearView/YearView.ts"
import type { YearViewConfig } from "./YearView/YearView.ts"
import type { WeekViewConfig } from "./WeekView/WeekView.ts"
import { ScheduleHeader } from "./ScheduleHeader/ScheduleHeader.ts"

export type ScheduleComponents = {
  readonly DayView?: DayViewConfig
  readonly AgendaView?: AgendaViewConfig
  readonly WeekView?: WeekViewConfig
  readonly MonthView?: MonthViewConfig
  readonly YearView?: YearViewConfig
  readonly MobileMonthView?: MobileMonthViewConfig
  readonly Schedule?: ScheduleComponentConfig
  readonly ResourcesDayView?: ResourcesDayViewConfig
  readonly ResourcesWeekView?: ResourcesWeekViewConfig
  readonly ResourcesMonthView?: ResourcesMonthViewConfig
  readonly ResourcesSchedule?: ResourcesScheduleConfig
}

export type ScheduleConfig = { readonly components?: ScheduleComponents }

export const createSchedule = (config: ScheduleConfig = {}) => {
  const components = config.components ?? {}

  return {
    DayView: DayView(components),
    AgendaView: AgendaView(components),
    WeekView: WeekView(components),
    MonthView: MonthView(components),
    YearView: YearView(components),
    MobileMonthView: MobileMonthView(components),
    Schedule: Schedule(components),
    ResourcesDayView: ResourcesDayView(components),
    ResourcesWeekView: ResourcesWeekView(components),
    ResourcesMonthView: ResourcesMonthView(components),
    ResourcesSchedule: ResourcesSchedule(components),
    ScheduleEvent,
    ScheduleHeader
  }
}

export type ScheduleUi = ReturnType<typeof createSchedule>

export const schedule = createSchedule()
