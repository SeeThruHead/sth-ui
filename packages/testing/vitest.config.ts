import { packageSuite } from "./src/Suites.ts"

export default packageSuite({ name: "testing", uncovered: ["fixtures/**", "src/Host.ts"] })
