export type ScheduleLabels = {
  readonly day: string
  readonly week: string
  readonly month: string
  readonly year: string
  readonly allDay: string
  readonly weekday: string
  readonly timeSlot: string
  readonly today: string
  readonly next: string
  readonly previous: string
  readonly more: string
  readonly selectMonth: string
  readonly selectYear: string
  readonly switchToDayView: string
  readonly switchToWeekView: string
  readonly switchToMonthView: string
  readonly switchToYearView: string
  readonly viewSelectLabel: string
  readonly noEvents: string
  readonly moreLabel: (hiddenEventsCount: number) => string
  readonly resource: string
  readonly resources: string
  readonly resourceSlot: string
  readonly agenda: string
}

export const defaultScheduleLabels: ScheduleLabels = {
  today: "Today",
  next: "Next",
  previous: "Previous",
  more: "More",
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
  allDay: "All day",
  weekday: "Weekday",
  timeSlot: "Time slot",
  selectMonth: "Select month",
  selectYear: "Select year",
  switchToDayView: "Switch to day view",
  switchToWeekView: "Switch to week view",
  switchToMonthView: "Switch to month view",
  switchToYearView: "Switch to year view",
  viewSelectLabel: "Calendar view",
  noEvents: "No events",
  moreLabel: (hiddenEventsCount) => `+${hiddenEventsCount} more`,
  resource: "Resource",
  resources: "Resources",
  resourceSlot: "Resource time slot",
  agenda: "Agenda"
}

export const scheduleLabels = (override: Partial<ScheduleLabels> = {}): ScheduleLabels => ({
  ...defaultScheduleLabels,
  ...override
})
