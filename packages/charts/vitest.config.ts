import { packageSuite } from "@sth-ui/testing/Suites.ts"

export default await packageSuite({
  name: "charts-logic",
  include: ["src/**/*.test.ts"],
  covered: [
    "src/shared/geometry.ts",
    "src/pie/pie.ts",
    "src/grid/grid.ts",
    "src/RadarChart/radar.ts",
    "src/FunnelChart/funnel.ts",
    "src/RadialBarChart/radial.ts",
    "src/BubbleChart/bubble.ts",
    "src/GaugeChart/gauge.ts",
    "src/Heatmap/calendar.ts",
    "src/WaffleChart/waffle.ts",
    "src/MatrixChart/matrix.ts",
    "src/Treemap/squarify.ts",
    "src/SunburstChart/sunburst.ts",
    "src/CandlestickChart/candles.ts",
    "src/SankeyChart/sankey.ts"
  ],
  reportsDirectory: "coverage/logic"
})
