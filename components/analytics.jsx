"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
} from "recharts"
import {
  BarChart3,
  TrendingUp,
  Activity,
  Target,
  Eye,
  Download,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Users,
  Calendar,
  ShoppingCart,
} from "lucide-react"

export default function Analytics({ data }) {
  const [selectedColumn, setSelectedColumn] = useState("")
  const [selectedColumn2, setSelectedColumn2] = useState("")
  const [chartData, setChartData] = useState([])
  const [correlationData, setCorrelationData] = useState([])
  const [distributionData, setDistributionData] = useState([])
  const [timeSeriesData, setTimeSeriesData] = useState([])
  const [stats, setStats] = useState(null)
  const [advancedStats, setAdvancedStats] = useState(null)
  const [businessInsights, setBusinessInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeAnalysis, setActiveAnalysis] = useState("business-overview")

  useEffect(() => {
    if (data && data.summary.numericColumns.length > 0) {
      setSelectedColumn(data.summary.numericColumns[0])
      if (data.summary.numericColumns.length > 1) {
        setSelectedColumn2(data.summary.numericColumns[1])
      }
    }
  }, [data])

  useEffect(() => {
    if (data && selectedColumn) {
      generateAnalytics()
    }
  }, [data, selectedColumn, selectedColumn2])

  const generateAnalytics = async () => {
    if (!data || !selectedColumn) return

    setLoading(true)

    try {
      // Basic statistics
      const values = data.rows.map((row) => Number.parseFloat(row[selectedColumn])).filter((val) => !isNaN(val))
      const basicStats = calculateBasicStats(values)
      setStats(basicStats)

      // Advanced statistics
      const advStats = calculateAdvancedStats(values)
      setAdvancedStats(advStats)

      // Business insights
      const insights = generateBusinessInsights(basicStats, advStats, values)
      setBusinessInsights(insights)

      // Distribution data
      const distribution = createDistribution(values)
      setDistributionData(distribution)

      // Time series analysis
      const timeSeries = createTimeSeriesData()
      setTimeSeriesData(timeSeries)

      // Correlation analysis
      if (data.summary.numericColumns.length > 1) {
        const correlations = calculateCorrelations()
        setCorrelationData(correlations)
      }

      // Chart data based on analysis type
      generateChartData()
    } catch (error) {
      console.error("Error generating analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateBasicStats = (values) => {
    const sum = values.reduce((a, b) => a + b, 0)
    const mean = sum / values.length
    const sortedValues = [...values].sort((a, b) => a - b)
    const median = sortedValues[Math.floor(sortedValues.length / 2)]
    const min = Math.min(...values)
    const max = Math.max(...values)
    const std = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length)
    const variance = std * std

    // Percentiles
    const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)]
    const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)]
    const iqr = q3 - q1

    return {
      count: values.length,
      sum: sum.toFixed(2),
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      std: std.toFixed(2),
      variance: variance.toFixed(2),
      range: (max - min).toFixed(2),
      q1: q1.toFixed(2),
      q3: q3.toFixed(2),
      iqr: iqr.toFixed(2),
    }
  }

  const calculateAdvancedStats = (values) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const std = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length)

    // Skewness
    const skewness = values.reduce((acc, val) => acc + Math.pow((val - mean) / std, 3), 0) / values.length

    // Kurtosis
    const kurtosis = values.reduce((acc, val) => acc + Math.pow((val - mean) / std, 4), 0) / values.length - 3

    // Coefficient of variation
    const cv = (std / mean) * 100

    // Outliers using IQR method
    const sortedValues = [...values].sort((a, b) => a - b)
    const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)]
    const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)]
    const iqr = q3 - q1
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr
    const outliers = values.filter((val) => val < lowerBound || val > upperBound)

    return {
      skewness: skewness.toFixed(3),
      kurtosis: kurtosis.toFixed(3),
      cv: cv.toFixed(2),
      outliers: outliers.length,
      outlierPercentage: ((outliers.length / values.length) * 100).toFixed(2),
    }
  }

  const generateBusinessInsights = (basicStats, advStats, values) => {
    const insights = {
      performance: [],
      opportunities: [],
      risks: [],
      recommendations: [],
    }

    const mean = Number.parseFloat(basicStats.mean)
    const median = Number.parseFloat(basicStats.median)
    const cv = Number.parseFloat(advStats.cv)
    const outlierPercentage = Number.parseFloat(advStats.outlierPercentage)

    // Performance insights
    if (mean > median) {
      insights.performance.push({
        type: "positive",
        title: "Above-Average Performance Days",
        description: `Your average ${selectedColumn} (${basicStats.mean}) is higher than the median (${basicStats.median}), indicating you have some exceptionally good performance days that boost your overall results.`,
      })
    }

    const topPerformers = values.filter((v) => v >= Number.parseFloat(basicStats.q3)).length
    insights.performance.push({
      type: "info",
      title: "Top 25% Performance",
      description: `${topPerformers} days (${((topPerformers / values.length) * 100).toFixed(1)}%) represent your top-performing periods. Understanding what drives these peaks could help replicate success.`,
    })

    // Opportunities
    if (cv > 30) {
      insights.opportunities.push({
        type: "opportunity",
        title: "High Variability = Optimization Potential",
        description: `Your ${selectedColumn} varies significantly (${cv}% variation). This suggests there's substantial room for improvement by identifying and addressing factors causing low-performance periods.`,
      })
    }

    const lowPerformers = values.filter((v) => v <= Number.parseFloat(basicStats.q1)).length
    insights.opportunities.push({
      type: "opportunity",
      title: "Underperforming Periods",
      description: `${lowPerformers} periods (${((lowPerformers / values.length) * 100).toFixed(1)}%) are in the bottom 25%. These represent your biggest improvement opportunities.`,
    })

    // Risks
    if (outlierPercentage > 10) {
      insights.risks.push({
        type: "warning",
        title: "Unpredictable Performance",
        description: `${outlierPercentage}% of your data points are outliers, indicating unpredictable swings in performance that could impact business planning.`,
      })
    }

    // Recommendations
    insights.recommendations.push({
      title: "Focus on Consistency",
      description:
        cv > 25
          ? "Your performance varies significantly. Focus on identifying what causes your best days and systematically apply those factors."
          : "Your performance is relatively consistent. Focus on gradual improvements to lift your baseline.",
    })

    if (mean > median * 1.1) {
      insights.recommendations.push({
        title: "Leverage Peak Performance",
        description:
          "You have some exceptional performance periods. Analyze what makes these days special and create processes to replicate them more frequently.",
      })
    }

    insights.recommendations.push({
      title: "Address Bottom Quartile",
      description: `Focus on improving your lowest 25% of performance periods. Even small improvements here can significantly impact your overall results.`,
    })

    return insights
  }

  const createDistribution = (values) => {
    const bins = 10 // Reduced for business clarity
    const min = Math.min(...values)
    const max = Math.max(...values)
    const binSize = (max - min) / bins

    const histogram = Array(bins)
      .fill(0)
      .map((_, i) => ({
        range: `${(min + i * binSize).toFixed(0)}-${(min + (i + 1) * binSize).toFixed(0)}`,
        count: 0,
        percentage: 0,
      }))

    values.forEach((val) => {
      const binIndex = Math.min(Math.floor((val - min) / binSize), bins - 1)
      if (binIndex >= 0) histogram[binIndex].count++
    })

    // Calculate percentages
    histogram.forEach((bin) => {
      bin.percentage = ((bin.count / values.length) * 100).toFixed(1)
    })

    return histogram
  }

  const createTimeSeriesData = () => {
    const dateColumns = ["date", "Date", "DATE", "timestamp"]
    const dateColumn = dateColumns.find((col) => data.headers.includes(col))

    if (!dateColumn) return []

    const timeSeries = data.rows
      .map((row) => ({
        date: new Date(row[dateColumn]).toLocaleDateString(),
        value: Number.parseFloat(row[selectedColumn]) || 0,
        timestamp: new Date(row[dateColumn]).getTime(),
      }))
      .filter((item) => !isNaN(item.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp)

    // Add trend indicators
    timeSeries.forEach((item, index) => {
      if (index > 0) {
        const prevValue = timeSeries[index - 1].value
        item.trend = item.value > prevValue ? "up" : item.value < prevValue ? "down" : "flat"
        item.change = (((item.value - prevValue) / prevValue) * 100).toFixed(1)
      }
    })

    return timeSeries.slice(0, 100) // Limit for performance
  }

  const calculateCorrelations = () => {
    const correlations = []
    const numericCols = data.summary.numericColumns.slice(0, 6) // Limit for business focus

    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const col1Values = data.rows.map((row) => Number.parseFloat(row[numericCols[i]])).filter((val) => !isNaN(val))
        const col2Values = data.rows.map((row) => Number.parseFloat(row[numericCols[j]])).filter((val) => !isNaN(val))

        if (col1Values.length > 0 && col2Values.length > 0) {
          const correlation = calculateCorrelation(col1Values, col2Values)
          correlations.push({
            x: numericCols[i],
            y: numericCols[j],
            correlation: correlation.toFixed(3),
            strength: getCorrelationStrength(Math.abs(correlation)),
            direction: correlation > 0 ? "Positive" : "Negative",
            businessImpact: getBusinessImpact(correlation, numericCols[i], numericCols[j]),
          })
        }
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
  }

  const calculateCorrelation = (x, y) => {
    const n = Math.min(x.length, y.length)
    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0)
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0)
    const sumXY = x.slice(0, n).reduce((acc, val, i) => acc + val * y[i], 0)
    const sumXX = x.slice(0, n).reduce((acc, val) => acc + val * val, 0)
    const sumYY = y.slice(0, n).reduce((acc, val) => acc + val * val, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  const getCorrelationStrength = (absCorr) => {
    if (absCorr >= 0.8) return "Very Strong"
    if (absCorr >= 0.6) return "Strong"
    if (absCorr >= 0.4) return "Moderate"
    if (absCorr >= 0.2) return "Weak"
    return "Very Weak"
  }

  const getBusinessImpact = (correlation, col1, col2) => {
    const absCorr = Math.abs(correlation)
    if (absCorr >= 0.6) {
      return correlation > 0
        ? `Strong positive relationship: When ${col1} increases, ${col2} typically increases too`
        : `Strong negative relationship: When ${col1} increases, ${col2} typically decreases`
    } else if (absCorr >= 0.3) {
      return correlation > 0
        ? `Moderate positive relationship: ${col1} and ${col2} tend to move in the same direction`
        : `Moderate negative relationship: ${col1} and ${col2} tend to move in opposite directions`
    }
    return `Weak relationship: ${col1} and ${col2} don't strongly influence each other`
  }

  const generateChartData = () => {
    const dateColumn = ["date", "Date", "DATE", "timestamp"].find((col) => data.headers.includes(col))

    if (dateColumn) {
      const timeData = data.rows
        .map((row) => ({
          date: new Date(row[dateColumn]).toLocaleDateString(),
          value: Number.parseFloat(row[selectedColumn]) || 0,
          timestamp: new Date(row[dateColumn]).getTime(),
        }))
        .filter((item) => !isNaN(item.timestamp))
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, 50) // Reduced for business clarity

      setChartData(timeData)
    } else {
      setChartData(distributionData)
    }
  }

  const exportAnalytics = () => {
    const businessReport = {
      summary: {
        metric: selectedColumn,
        totalRecords: stats?.count,
        averageValue: stats?.mean,
        bestPerformance: stats?.max,
        worstPerformance: stats?.min,
        consistency: advancedStats?.cv < 20 ? "High" : advancedStats?.cv < 40 ? "Medium" : "Low",
      },
      insights: businessInsights,
      keyMetrics: stats,
      recommendations: businessInsights?.recommendations || [],
    }

    const dataStr = JSON.stringify(businessReport, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "business_analytics_report.json"
    link.click()
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <BarChart3 className="h-4 w-4" />
          <AlertDescription>
            Please upload your sales data first to view business analytics and insights.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Business-Friendly Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <DollarSign className="h-6 w-6" />
                Business Performance Analytics
              </CardTitle>
              <CardDescription className="text-blue-700">
                Understand your business performance with clear insights and actionable recommendations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={generateAnalytics} disabled={loading} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh Analysis
              </Button>
              <Button onClick={exportAnalytics} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-900">What would you like to analyze?</label>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Choose your key metric" />
                </SelectTrigger>
                <SelectContent>
                  {data.summary.numericColumns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-900">Compare with (optional)</label>
              <Select value={selectedColumn2} onValueChange={setSelectedColumn2}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Choose a comparison metric" />
                </SelectTrigger>
                <SelectContent>
                  {data.summary.numericColumns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column.charAt(0).toUpperCase() + column.slice(1).replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business KPI Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Average Performance</p>
                  <p className="text-2xl font-bold text-green-900">{stats.mean}</p>
                  <p className="text-xs text-green-700">Your typical day</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Best Performance</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.max}</p>
                  <p className="text-xs text-blue-700">Your peak day</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Consistency</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {advancedStats?.cv < 20 ? "High" : advancedStats?.cv < 40 ? "Medium" : "Low"}
                  </p>
                  <p className="text-xs text-purple-700">Performance stability</p>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Records</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.count}</p>
                  <p className="text-xs text-orange-700">Data points analyzed</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Business-Focused Analytics Tabs */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <Tabs value={activeAnalysis} onValueChange={setActiveAnalysis}>
            <TabsList className="grid w-full grid-cols-4 bg-gray-50 p-1 m-1 rounded-lg">
              <TabsTrigger value="business-overview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Business Overview
              </TabsTrigger>
              <TabsTrigger value="performance-trends" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance Trends
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Key Insights
              </TabsTrigger>
              <TabsTrigger value="relationships" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Factor Relationships
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="business-overview" className="mt-0 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        Performance Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {stats && (
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-blue-900">Average Daily Performance</span>
                              <span className="text-2xl font-bold text-blue-900">{stats.mean}</span>
                            </div>
                            <p className="text-sm text-blue-700">
                              This is what you can typically expect on any given day
                            </p>
                          </div>

                          <div className="p-4 bg-green-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-green-900">Your Best Day</span>
                              <span className="text-2xl font-bold text-green-900">{stats.max}</span>
                            </div>
                            <p className="text-sm text-green-700">
                              {((Number.parseFloat(stats.max) / Number.parseFloat(stats.mean) - 1) * 100).toFixed(0)}%
                              above your average
                            </p>
                          </div>

                          <div className="p-4 bg-red-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-red-900">Your Worst Day</span>
                              <span className="text-2xl font-bold text-red-900">{stats.min}</span>
                            </div>
                            <p className="text-sm text-red-700">
                              {((1 - Number.parseFloat(stats.min) / Number.parseFloat(stats.mean)) * 100).toFixed(0)}%
                              below your average
                            </p>
                          </div>

                          <div className="p-4 bg-purple-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-purple-900">Performance Range</span>
                              <span className="text-2xl font-bold text-purple-900">{stats.range}</span>
                            </div>
                            <p className="text-sm text-purple-700">The difference between your best and worst days</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Distribution</CardTitle>
                      <CardDescription>How often you hit different performance levels</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={distributionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip
                            formatter={(value, name) => [`${value}%`, "Percentage of Days"]}
                            labelFormatter={(label) => `Performance Range: ${label}`}
                          />
                          <Bar dataKey="percentage" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance Quartiles */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Quartiles - Where Do You Stand?</CardTitle>
                    <CardDescription>Understanding your performance distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                        <div className="text-2xl font-bold text-red-600">
                          {stats?.min} - {stats?.q1}
                        </div>
                        <div className="text-sm font-medium text-red-800">Bottom 25%</div>
                        <div className="text-xs text-red-600 mt-1">Your challenging days</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-600">
                          {stats?.q1} - {stats?.median}
                        </div>
                        <div className="text-sm font-medium text-yellow-800">25% - 50%</div>
                        <div className="text-xs text-yellow-600 mt-1">Below average days</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <div className="text-2xl font-bold text-blue-600">
                          {stats?.median} - {stats?.q3}
                        </div>
                        <div className="text-sm font-medium text-blue-800">50% - 75%</div>
                        <div className="text-xs text-blue-600 mt-1">Above average days</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <div className="text-2xl font-bold text-green-600">
                          {stats?.q3} - {stats?.max}
                        </div>
                        <div className="text-sm font-medium text-green-800">Top 25%</div>
                        <div className="text-xs text-green-600 mt-1">Your best days</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance-trends" className="mt-0 space-y-6">
                {timeSeriesData.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Performance Over Time
                      </CardTitle>
                      <CardDescription>Track your business performance trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={timeSeriesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [
                              value,
                              selectedColumn.charAt(0).toUpperCase() + selectedColumn.slice(1),
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            strokeWidth={3}
                            dot={{ fill: "#8884d8", strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No date information found in your data for trend analysis</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Add a date column to see performance trends over time
                      </p>
                    </CardContent>
                  </Card>
                )}

                {selectedColumn2 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Factor Comparison</CardTitle>
                      <CardDescription>
                        How {selectedColumn.replace(/_/g, " ")} relates to {selectedColumn2.replace(/_/g, " ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart
                          data={data.rows.slice(0, 100).map((row) => ({
                            x: Number.parseFloat(row[selectedColumn]) || 0,
                            y: Number.parseFloat(row[selectedColumn2]) || 0,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="x"
                            name={selectedColumn.replace(/_/g, " ")}
                            label={{ value: selectedColumn.replace(/_/g, " "), position: "insideBottom", offset: -10 }}
                          />
                          <YAxis
                            dataKey="y"
                            name={selectedColumn2.replace(/_/g, " ")}
                            label={{ value: selectedColumn2.replace(/_/g, " "), angle: -90, position: "insideLeft" }}
                          />
                          <Tooltip formatter={(value, name) => [value, name.replace(/_/g, " ")]} />
                          <Scatter fill="#8884d8" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="insights" className="mt-0 space-y-6">
                {businessInsights && (
                  <>
                    {/* Performance Insights */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          What's Working Well
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {businessInsights.performance.map((insight, index) => (
                            <div key={index} className="p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                              <h4 className="font-medium text-green-900">{insight.title}</h4>
                              <p className="text-sm text-green-700 mt-1">{insight.description}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Opportunities */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          Growth Opportunities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {businessInsights.opportunities.map((opportunity, index) => (
                            <div key={index} className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                              <h4 className="font-medium text-blue-900">{opportunity.title}</h4>
                              <p className="text-sm text-blue-700 mt-1">{opportunity.description}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Risks */}
                    {businessInsights.risks.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                            Areas of Concern
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {businessInsights.risks.map((risk, index) => (
                              <div key={index} className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                                <h4 className="font-medium text-yellow-900">{risk.title}</h4>
                                <p className="text-sm text-yellow-700 mt-1">{risk.description}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Recommendations */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-purple-600" />
                          Recommended Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {businessInsights.recommendations.map((recommendation, index) => (
                            <div key={index} className="p-4 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                              <h4 className="font-medium text-purple-900">{recommendation.title}</h4>
                              <p className="text-sm text-purple-700 mt-1">{recommendation.description}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="relationships" className="mt-0 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      How Your Business Factors Connect
                    </CardTitle>
                    <CardDescription>Understanding which factors influence each other in your business</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {correlationData.slice(0, 8).map((corr, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-900">
                              {corr.x.replace(/_/g, " ").toUpperCase()} ↔ {corr.y.replace(/_/g, " ").toUpperCase()}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  Math.abs(Number.parseFloat(corr.correlation)) > 0.6
                                    ? "destructive"
                                    : Math.abs(Number.parseFloat(corr.correlation)) > 0.3
                                      ? "default"
                                      : "secondary"
                                }
                              >
                                {corr.strength}
                              </Badge>
                              <span className="font-bold text-lg">{corr.correlation}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{corr.businessImpact}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
