const pad = (value: number) => String(value).padStart(2, "0")

const daysIn = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export const data: Readonly<Record<string, number>> = Object.fromEntries(
  daysIn.flatMap((days, month) =>
    Array.from({ length: days }, (_, index) => {
      const day = index + 1
      const value = (month * 7 + day * 13) % 23

      return value < 4 ? [] : [[`2024-${pad(month + 1)}-${pad(day)}`, value] as const]
    }).flat()
  )
)
