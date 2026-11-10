import { packageSuite } from "@sth-ui/testing/Suites.ts"

export default await packageSuite({
  name: "schedule-logic",
  include: ["src/**/*.test.ts"],
  covered: [
    "src/datetime.ts",
    "src/recurrence.ts",
    "src/events.ts",
    "src/dayLayout.ts",
    "src/labels.ts",
    "src/format.ts",
    "src/businessHours.ts",
    "src/placement.ts",
    "src/DayView/interaction.ts",
    "src/DayView/model.ts",
    "src/ScheduleHeader/keys.ts",
    "src/AgendaView/agenda.ts",
    "src/weekLayout.ts",
    "src/TimeGrid/keys.ts",
    "src/monthLayout.ts",
    "src/Schedule/model.ts",
    "src/resourcesLayout.ts",
    "src/defined.ts"
  ],
  reportsDirectory: "coverage/logic"
})
