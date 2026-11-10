import { packageSuite } from "@sth-ui/testing/Suites.ts"

export default await packageSuite({
  name: "tiptap-logic",
  include: ["src/**/*.test.ts"],
  covered: ["src/labels.ts"],
  reportsDirectory: "coverage/logic"
})
