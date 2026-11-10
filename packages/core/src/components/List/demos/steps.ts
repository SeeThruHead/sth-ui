import type { ListItem } from "../List.ts"

export const steps: ReadonlyArray<ListItem> = [
  { children: ["Clone or download repository from GitHub"] },
  { children: ["Install dependencies with yarn"] },
  { children: ["To start development server run npm start command"] },
  { children: ["Run tests to make sure your changes do not break the build"] },
  { children: ["Submit a pull request once you are done"] }
]
