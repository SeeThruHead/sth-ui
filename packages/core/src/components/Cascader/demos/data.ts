import type { CascaderOption } from "../model.ts"

const city = (value: string, label: string): CascaderOption => ({ value, label })

export const data: ReadonlyArray<CascaderOption> = [
  {
    value: "asia",
    label: "Asia",
    children: [
      {
        value: "jp",
        label: "Japan",
        children: [city("tokyo", "Tokyo"), city("osaka", "Osaka"), city("kyoto", "Kyoto")]
      },
      { value: "kr", label: "South Korea", children: [city("seoul", "Seoul"), city("busan", "Busan")] }
    ]
  },
  {
    value: "europe",
    label: "Europe",
    children: [
      { value: "fr", label: "France", children: [city("paris", "Paris"), city("lyon", "Lyon")] },
      { value: "de", label: "Germany", children: [city("berlin", "Berlin"), city("munich", "Munich")] }
    ]
  },
  {
    value: "north-america",
    label: "North America",
    children: [
      {
        value: "us",
        label: "United States",
        children: [city("new-york", "New York"), city("san-francisco", "San Francisco")]
      },
      { value: "ca", label: "Canada", children: [city("toronto", "Toronto"), city("vancouver", "Vancouver")] }
    ]
  }
]

export const withDisabled: ReadonlyArray<CascaderOption> = data.map((continent) =>
  continent.value === "europe" ? { ...continent, disabled: true } : continent
)
