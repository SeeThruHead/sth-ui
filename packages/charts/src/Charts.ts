import { AreaChart } from "./AreaChart/AreaChart.ts"
import type { AreaChartConfig } from "./AreaChart/AreaChart.ts"
import { BarChart } from "./BarChart/BarChart.ts"
import type { BarChartConfig } from "./BarChart/BarChart.ts"
import { BarsList } from "./BarsList/BarsList.ts"
import type { BarsListConfig } from "./BarsList/BarsList.ts"
import { CandlestickChart } from "./CandlestickChart/CandlestickChart.ts"
import type { CandlestickChartConfig } from "./CandlestickChart/CandlestickChart.ts"
import { BubbleChart } from "./BubbleChart/BubbleChart.ts"
import type { BubbleChartConfig } from "./BubbleChart/BubbleChart.ts"
import { BulletChart } from "./BulletChart/BulletChart.ts"
import type { BulletChartConfig } from "./BulletChart/BulletChart.ts"
import { CompositeChart } from "./CompositeChart/CompositeChart.ts"
import type { CompositeChartConfig } from "./CompositeChart/CompositeChart.ts"
import { DonutChart } from "./DonutChart/DonutChart.ts"
import type { DonutChartConfig } from "./DonutChart/DonutChart.ts"
import { FunnelChart } from "./FunnelChart/FunnelChart.ts"
import type { FunnelChartConfig } from "./FunnelChart/FunnelChart.ts"
import { GaugeChart } from "./GaugeChart/GaugeChart.ts"
import type { GaugeChartConfig } from "./GaugeChart/GaugeChart.ts"
import { Heatmap } from "./Heatmap/Heatmap.ts"
import type { HeatmapConfig } from "./Heatmap/Heatmap.ts"
import { LineChart } from "./LineChart/LineChart.ts"
import type { LineChartConfig } from "./LineChart/LineChart.ts"
import { MatrixChart } from "./MatrixChart/MatrixChart.ts"
import type { MatrixChartConfig } from "./MatrixChart/MatrixChart.ts"
import { PieChart } from "./PieChart/PieChart.ts"
import type { PieChartConfig } from "./PieChart/PieChart.ts"
import { RadialBarChart } from "./RadialBarChart/RadialBarChart.ts"
import type { RadialBarChartConfig } from "./RadialBarChart/RadialBarChart.ts"
import { RadarChart } from "./RadarChart/RadarChart.ts"
import type { RadarChartConfig } from "./RadarChart/RadarChart.ts"
import { SankeyChart } from "./SankeyChart/SankeyChart.ts"
import type { SankeyChartConfig } from "./SankeyChart/SankeyChart.ts"
import { ScatterChart } from "./ScatterChart/ScatterChart.ts"
import type { ScatterChartConfig } from "./ScatterChart/ScatterChart.ts"
import { SunburstChart } from "./SunburstChart/SunburstChart.ts"
import type { SunburstChartConfig } from "./SunburstChart/SunburstChart.ts"
import { Treemap } from "./Treemap/Treemap.ts"
import type { TreemapConfig } from "./Treemap/Treemap.ts"
import { WaffleChart } from "./WaffleChart/WaffleChart.ts"
import type { WaffleChartConfig } from "./WaffleChart/WaffleChart.ts"
import { Sparkline } from "./Sparkline/Sparkline.ts"
import type { SparklineConfig } from "./Sparkline/Sparkline.ts"

export type ChartsComponents = {
  readonly Sparkline?: SparklineConfig
  readonly DonutChart?: DonutChartConfig
  readonly PieChart?: PieChartConfig
  readonly LineChart?: LineChartConfig
  readonly AreaChart?: AreaChartConfig
  readonly BarChart?: BarChartConfig
  readonly CompositeChart?: CompositeChartConfig
  readonly RadarChart?: RadarChartConfig
  readonly FunnelChart?: FunnelChartConfig
  readonly RadialBarChart?: RadialBarChartConfig
  readonly ScatterChart?: ScatterChartConfig
  readonly BubbleChart?: BubbleChartConfig
  readonly GaugeChart?: GaugeChartConfig
  readonly Heatmap?: HeatmapConfig
  readonly WaffleChart?: WaffleChartConfig
  readonly BulletChart?: BulletChartConfig
  readonly MatrixChart?: MatrixChartConfig
  readonly BarsList?: BarsListConfig
  readonly Treemap?: TreemapConfig
  readonly SunburstChart?: SunburstChartConfig
  readonly CandlestickChart?: CandlestickChartConfig
  readonly SankeyChart?: SankeyChartConfig
}

export type ChartsConfig = { readonly components?: ChartsComponents }

export const createCharts = (config: ChartsConfig = {}) => {
  const components = config.components ?? {}

  return {
    Sparkline: Sparkline(components),
    DonutChart: DonutChart(components),
    PieChart: PieChart(components),
    LineChart: LineChart(components),
    AreaChart: AreaChart(components),
    BarChart: BarChart(components),
    CompositeChart: CompositeChart(components),
    RadarChart: RadarChart(components),
    FunnelChart: FunnelChart(components),
    RadialBarChart: RadialBarChart(components),
    ScatterChart: ScatterChart(components),
    BubbleChart: BubbleChart(components),
    GaugeChart: GaugeChart(components),
    Heatmap: Heatmap(components),
    WaffleChart: WaffleChart(components),
    BulletChart: BulletChart(components),
    MatrixChart: MatrixChart(components),
    BarsList: BarsList(components),
    Treemap: Treemap(components),
    SunburstChart: SunburstChart(components),
    CandlestickChart: CandlestickChart(components),
    SankeyChart: SankeyChart(components)
  }
}

export type Charts = ReturnType<typeof createCharts>

export const charts = createCharts()
