import type { TreeNodeData } from "../Tree.ts"

const files = (folder: string) => [
  { label: "index.d.ts", value: `${folder}/index.d.ts` },
  { label: "package.json", value: `${folder}/package.json` }
]

export const data: ReadonlyArray<TreeNodeData> = [
  {
    label: "src",
    value: "src",
    children: [
      {
        label: "components",
        value: "src/components",
        children: [
          { label: "Accordion.tsx", value: "src/components/Accordion.tsx" },
          { label: "Tree.tsx", value: "src/components/Tree.tsx" },
          { label: "Button.tsx", value: "src/components/Button.tsx" }
        ]
      }
    ]
  },
  {
    label: "node_modules",
    value: "node_modules",
    children: [
      { label: "react", value: "node_modules/react", children: files("node_modules/react") },
      {
        label: "@mantine",
        value: "node_modules/@mantine",
        children: [
          { label: "core", value: "node_modules/@mantine/core", children: files("node_modules/@mantine/core") },
          { label: "hooks", value: "node_modules/@mantine/hooks", children: files("node_modules/@mantine/hooks") },
          { label: "form", value: "node_modules/@mantine/form", children: files("node_modules/@mantine/form") }
        ]
      }
    ]
  },
  { label: "package.json", value: "package.json" },
  { label: "tsconfig.json", value: "tsconfig.json" }
]
