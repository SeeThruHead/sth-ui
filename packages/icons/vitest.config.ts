import { packageSuite } from "@sth-ui/testing/Suites.ts"

export default await packageSuite({
  name: "icons",
  include: ["src/**/*.test.ts", "tools/**/*.test.ts"],
  covered: ["src/Icon.ts", "tools/svg.ts"]
})
