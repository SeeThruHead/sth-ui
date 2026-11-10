import { packageSuite } from "@sth-ui/testing/Suites.ts"

export default packageSuite({
  name: "lint",
  include: ["*.test.ts", "tools/*.test.ts"],
  covered: ["duplicates.ts", "typeOnly.ts", "fanIn.ts", "layout.ts", "tools/attribution.ts"]
})
