import type { DataTableColumn, FilterOption } from "../DataTable.ts"

export type Game = {
  readonly id: string
  readonly title: string
  readonly system: string
  readonly regions: ReadonlyArray<string>
  readonly rating: number | null
  readonly size: number
  readonly added: string
  readonly verified: boolean
}

const names = [
  "Tetris",
  "Zelda",
  "Metroid",
  "Kirby",
  "Mario",
  "Pokémon",
  "Castlevania",
  "Contra",
  "Mega Man",
  "Donkey Kong"
]

const systems: ReadonlyArray<FilterOption> = [
  { value: "gb", label: "Game Boy" },
  { value: "gbc", label: "Game Boy Color" },
  { value: "nes", label: "NES" },
  { value: "snes", label: "Super NES" }
]

const regions: ReadonlyArray<FilterOption> = [
  { value: "us", label: "USA" },
  { value: "eu", label: "Europe" },
  { value: "jp", label: "Japan" }
]

const regionSets: ReadonlyArray<ReadonlyArray<string>> = [["us"], ["eu"], ["jp"], ["us", "eu"], ["eu", "jp"]]

const pad = (value: number) => String(value).padStart(2, "0")

export const makeGames = (count: number): ReadonlyArray<Game> =>
  Array.from({ length: count }, (_, index) => ({
    id: `game-${index + 1}`,
    title: `${names[index % names.length] ?? "Game"} ${Math.floor(index / names.length) + 1}`,
    system: systems[index % systems.length]?.value ?? "gb",
    regions: regionSets[index % regionSets.length] ?? [],
    rating: index % 7 === 0 ? null : ((index * 37) % 51) / 10,
    size: ((index * 7919) % 4096) * 1024 + 32768,
    added: `202${index % 5}-${pad((index % 12) + 1)}-${pad((index % 28) + 1)}`,
    verified: index % 3 !== 0
  }))

export const games = makeGames(2000)

const megabytes = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`

export const columns: ReadonlyArray<DataTableColumn<Game>> = [
  {
    id: "title",
    title: "Title",
    value: (game) => game.title,
    sortable: true,
    filter: { _tag: "Text" },
    hideable: false
  },
  {
    id: "system",
    title: "System",
    value: (game) => game.system,
    sortable: true,
    filter: { _tag: "Options", options: systems },
    width: 130
  },
  {
    id: "region",
    title: "Region",
    value: (game) => game.regions,
    sortable: true,
    filter: { _tag: "Options", options: regions },
    width: 130
  },
  {
    id: "rating",
    title: "Rating",
    value: (game) => game.rating,
    sortable: true,
    filter: { _tag: "NumberRange" },
    width: 120,
    align: "end"
  },
  {
    id: "size",
    title: "Size",
    value: (game) => game.size,
    render: (game) => megabytes(game.size),
    sortable: true,
    filter: { _tag: "NumberRange" },
    width: 110,
    align: "end"
  },
  {
    id: "added",
    title: "Added",
    value: (game) => game.added,
    sortable: true,
    filter: { _tag: "DateRange" },
    width: 130
  },
  {
    id: "verified",
    title: "Verified",
    value: (game) => game.verified,
    render: (game) => (game.verified ? "Yes" : "No"),
    filter: { _tag: "Boolean" },
    width: 120
  }
]

export const searchText = (game: Game) => game.title

export const rowId = (game: Game) => game.id
