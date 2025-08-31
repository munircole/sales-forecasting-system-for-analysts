"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  BarChart3,
  Eye,
  Download,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  Users,
  Zap,
  CheckCircle,
  Target,
  Database,
  Search,
  TrendingUp,
  PieChart,
  Settings,
} from "lucide-react"

const COLORS = ["#10B981", "#059669", "#047857", "#065F46", "#064E3B", "#6EE7B7", "#34D399", "#A7F3D0"]

export default function EnhancedAnalytics({ data }) {
  const [analysisResults, setAnalysisResults] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedColumn, setSelectedColumn] = useState("")
  const [correlationResults, setCorrelationResults] = useState([])
  const [decodingResults, setDecodingResults] = useState({})
  const [segmentAnalysis, setSegmentAnalysis] = useState({})
  const [analysisLog, setAnalysisLog] = useState([])
  const [showDecodingDialog, setShowDecodingDialog] = useState(false)
  const [currentEncodedColumn, setCurrentEncodedColumn] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [userDecodingMappings, setUserDecodingMappings] = useState({})
  const [pendingDecodingColumns, setPendingDecodingColumns] = useState([])
  const [salesAnalysis, setSalesAnalysis] = useState({})
  const [predictions, setPredictions] = useState({})
  const [showPredictions, setShowPredictions] = useState(false)

  useEffect(() => {
    if (data && data.headers && data.rows) {
      if (data.summary && data.summary.numericColumns && data.summary.numericColumns.length > 0) {
        setSelectedColumn(data.summary.numericColumns[0])
      }
      runAutomaticAnalysis()
    }
  }, [data])

  const runAutomaticAnalysis = async () => {
    if (!data || !data.headers || !data.rows) return

    setProcessing(true)
    setProgress(0)
    setAnalysisLog([])

    try {
      addToLog("Starting comprehensive data analysis...", "info")
      setProgress(10)

      // Step 1: Basic data profiling
      addToLog("Step 1: Analyzing data structure and types...", "info")
      await new Promise((resolve) => setTimeout(resolve, 500))

      const basicAnalysis = performBasicAnalysis()
      setProgress(20)

      // Step 2: Detect encoded columns and request user input
      addToLog("Step 2: Detecting encoded columns and patterns...", "info")
      await new Promise((resolve) => setTimeout(resolve, 300))

      const encodedColumns = detectEncodedColumns()
      if (Object.keys(encodedColumns).length > 0) {
        setPendingDecodingColumns(Object.keys(encodedColumns))
        addToLog("Found encoded columns - user input needed for decoding", "warning")
      }
      setProgress(35)

      // Step 3: Perform sales analysis
      addToLog("Step 3: Analyzing sales patterns and totals...", "info")
      await new Promise((resolve) => setTimeout(resolve, 500))

      const salesData = performSalesAnalysis()
      setSalesAnalysis(salesData)
      setProgress(50)

      // Step 4: Calculate correlations with explanations
      addToLog("Step 4: Computing correlations and relationships...", "info")
      await new Promise((resolve) => setTimeout(resolve, 500))

      const correlations = calculateEnhancedCorrelations()
      setProgress(65)

      // Step 5: Enhanced segment analysis
      addToLog("Step 5: Performing detailed segment analysis...", "info")
      await new Promise((resolve) => setTimeout(resolve, 400))

      const segments = performEnhancedSegmentAnalysis()
      setProgress(80)

      // Step 6: Generate predictions
      addToLog("Step 6: Generating sales predictions...", "info")
      await new Promise((resolve) => setTimeout(resolve, 400))

      const predictionData = generatePredictions()
      setPredictions(predictionData)
      setProgress(95)

      // Step 7: Generate insights
      addToLog("Step 7: Generating insights and recommendations...", "info")
      await new Promise((resolve) => setTimeout(resolve, 300))

      const insights = generateEnhancedInsights(basicAnalysis, correlations, segments, salesData)
      setProgress(100)

      const finalResults = {
        basic: basicAnalysis,
        encoded: encodedColumns,
        correlations: correlations,
        segments: segments,
        sales: salesData,
        predictions: predictionData,
        insights: insights,
        metadata: {
          analyzedAt: new Date().toISOString(),
          totalRows: data.rows.length,
          totalColumns: data.headers.length,
        },
      }

      setAnalysisResults(finalResults)
      setCorrelationResults(correlations)
      setDecodingResults(encodedColumns)
      setSegmentAnalysis(segments)

      addToLog("Comprehensive analysis completed successfully!", "success")
    } catch (error) {
      addToLog(`Analysis error: ${error.message}`, "error")
      console.error("Analysis error:", error)
    } finally {
      setProcessing(false)
    }
  }

  const performSalesAnalysis = () => {
    const salesColumns = data.headers.filter(
      (header) =>
        header.toLowerCase().includes("amount") ||
        header.toLowerCase().includes("sales") ||
        header.toLowerCase().includes("revenue") ||
        header.toLowerCase().includes("price") ||
        header.toLowerCase().includes("total"),
    )

    const categoricalColumns = data.headers.filter((header) => {
      const values = data.rows.map((row) => row[header]).filter(Boolean)
      const uniqueValues = [...new Set(values)]
      return uniqueValues.length > 1 && uniqueValues.length <= 50
    })

    const analysis = {}

    categoricalColumns.forEach((catCol) => {
      const categoryAnalysis = {}
      const uniqueValues = [...new Set(data.rows.map((row) => row[catCol]).filter(Boolean))]

      uniqueValues.forEach((category) => {
        const categoryRows = data.rows.filter((row) => row[catCol] === category)

        salesColumns.forEach((salesCol) => {
          const salesValues = categoryRows.map((row) => Number.parseFloat(row[salesCol])).filter((val) => !isNaN(val))

          if (salesValues.length > 0) {
            const total = salesValues.reduce((a, b) => a + b, 0)
            const average = total / salesValues.length
            const count = salesValues.length

            if (!categoryAnalysis[category]) {
              categoryAnalysis[category] = {}
            }

            categoryAnalysis[category][salesCol] = {
              total: total.toFixed(2),
              average: average.toFixed(2),
              count: count,
              percentage: (
                (total /
                  data.rows.reduce((sum, row) => {
                    const val = Number.parseFloat(row[salesCol])
                    return sum + (isNaN(val) ? 0 : val)
                  }, 0)) *
                100
              ).toFixed(1),
            }
          }
        })
      })

      if (Object.keys(categoryAnalysis).length > 0) {
        analysis[catCol] = categoryAnalysis
      }
    })

    return analysis
  }

  const calculateEnhancedCorrelations = () => {
    const numericCols = data.summary?.numericColumns || []
    const correlations = []

    for (let i = 0; i < numericCols.length; i++) {
      for (let j = i + 1; j < numericCols.length; j++) {
        const col1 = numericCols[i]
        const col2 = numericCols[j]

        const values1 = data.rows.map((row) => Number.parseFloat(row[col1])).filter((val) => !isNaN(val))
        const values2 = data.rows.map((row) => Number.parseFloat(row[col2])).filter((val) => !isNaN(val))

        if (values1.length > 10 && values2.length > 10) {
          const correlation = calculatePearsonCorrelation(values1, values2)
          const strength = getCorrelationStrength(Math.abs(correlation))

          correlations.push({
            column1: col1,
            column2: col2,
            correlation: correlation.toFixed(3),
            strength: strength,
            direction: correlation > 0 ? "Positive" : "Negative",
            explanation: generateCorrelationExplanation(col1, col2, correlation, strength),
            businessImplication: generateBusinessImplication(col1, col2, correlation),
          })
        }
      }
    }

    return correlations.sort(
      (a, b) => Math.abs(Number.parseFloat(b.correlation)) - Math.abs(Number.parseFloat(a.correlation)),
    )
  }

  const generateCorrelationExplanation = (col1, col2, correlation, strength) => {
    const direction = correlation > 0 ? "increases" : "decreases"
    const strengthDesc = {
      "Very Strong": "very strongly",
      Strong: "strongly",
      Moderate: "moderately",
      Weak: "weakly",
      "Very Weak": "very weakly",
    }

    return `When ${col1.replace(/_/g, " ")} increases, ${col2.replace(/_/g, " ")} ${direction} ${strengthDesc[strength]}. This ${strength.toLowerCase()} ${correlation > 0 ? "positive" : "negative"} relationship suggests ${Math.abs(correlation) > 0.7 ? "a strong dependency" : "some level of association"} between these variables.`
  }

  const generateBusinessImplication = (col1, col2, correlation) => {
    if (Math.abs(correlation) > 0.7) {
      return `Strong relationship detected. Consider using ${col1} as a predictor for ${col2} in forecasting models.`
    } else if (Math.abs(correlation) > 0.5) {
      return `Moderate relationship suggests these variables should be analyzed together for business insights.`
    } else if (Math.abs(correlation) > 0.3) {
      return `Weak but notable relationship. May indicate indirect business connections worth investigating.`
    } else {
      return `Little to no linear relationship. These variables appear to be independent.`
    }
  }

  const generatePredictions = () => {
    const predictions = {}
    const salesColumns = data.headers.filter(
      (header) =>
        header.toLowerCase().includes("amount") ||
        header.toLowerCase().includes("sales") ||
        header.toLowerCase().includes("revenue"),
    )

    const categoricalColumns = data.headers.filter((header) => {
      const values = data.rows.map((row) => row[header]).filter(Boolean)
      const uniqueValues = [...new Set(values)]
      return uniqueValues.length > 1 && uniqueValues.length <= 20
    })

    categoricalColumns.forEach((catCol) => {
      const uniqueValues = [...new Set(data.rows.map((row) => row[catCol]).filter(Boolean))]

      salesColumns.forEach((salesCol) => {
        const categoryPredictions = {}

        uniqueValues.forEach((category) => {
          const categoryRows = data.rows.filter((row) => row[catCol] === category)
          const salesValues = categoryRows.map((row) => Number.parseFloat(row[salesCol])).filter((val) => !isNaN(val))

          if (salesValues.length >= 3) {
            const average = salesValues.reduce((a, b) => a + b, 0) / salesValues.length
            const trend = calculateTrend(salesValues)
            const nextPeriodPrediction = average * (1 + trend)

            categoryPredictions[category] = {
              currentAverage: average.toFixed(2),
              trend: (trend * 100).toFixed(1) + "%",
              nextPeriodPrediction: nextPeriodPrediction.toFixed(2),
              confidence: salesValues.length > 10 ? "High" : salesValues.length > 5 ? "Medium" : "Low",
              dataPoints: salesValues.length,
            }
          }
        })

        if (Object.keys(categoryPredictions).length > 0) {
          if (!predictions[catCol]) predictions[catCol] = {}
          predictions[catCol][salesCol] = categoryPredictions
        }
      })
    })

    return predictions
  }

  const calculateTrend = (values) => {
    if (values.length < 2) return 0

    const n = values.length
    const sumX = (n * (n + 1)) / 2
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0)
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const avgY = sumY / n

    return slope / avgY // Return as percentage change
  }

  const performBasicAnalysis = () => {
    const analysis = {
      columnTypes: {},
      categoricalColumns: [],
      numericColumns: [],
      dataQuality: {
        completeness: 0,
        missingValues: {},
        duplicates: 0,
      },
      summary: {},
    }

    // Analyze each column
    data.headers.forEach((column) => {
      const values = data.rows.map((row) => row[column])
      const nonEmptyValues = values.filter((val) => val !== null && val !== undefined && val !== "")

      // Calculate completeness
      const completeness = (nonEmptyValues.length / values.length) * 100
      analysis.dataQuality.missingValues[column] = values.length - nonEmptyValues.length

      // Determine column type
      const numericValues = nonEmptyValues.filter((val) => !isNaN(Number.parseFloat(val)))
      const isNumeric = numericValues.length > nonEmptyValues.length * 0.8

      if (isNumeric && numericValues.length > 0) {
        analysis.columnTypes[column] = "numeric"
        analysis.numericColumns.push(column)

        const nums = numericValues.map((val) => Number.parseFloat(val))
        analysis.summary[column] = {
          min: Math.min(...nums),
          max: Math.max(...nums),
          mean: nums.reduce((a, b) => a + b, 0) / nums.length,
          median: nums.sort((a, b) => a - b)[Math.floor(nums.length / 2)],
          count: nums.length,
        }
      } else {
        analysis.columnTypes[column] = "categorical"
        analysis.categoricalColumns.push(column)

        const uniqueValues = [...new Set(nonEmptyValues)]
        analysis.summary[column] = {
          uniqueCount: uniqueValues.length,
          mostCommon: uniqueValues.reduce(
            (a, b) =>
              nonEmptyValues.filter((v) => v === a).length >= nonEmptyValues.filter((v) => v === b).length ? a : b,
            uniqueValues[0],
          ),
          values: uniqueValues.slice(0, 10),
        }
      }
    })

    // Calculate overall completeness
    const totalCells = data.headers.length * data.rows.length
    const missingCells = Object.values(analysis.dataQuality.missingValues).reduce((a, b) => a + b, 0)
    analysis.dataQuality.completeness = ((totalCells - missingCells) / totalCells) * 100

    return analysis
  }

  const detectEncodedColumns = () => {
    const encoded = {}

    data.headers.forEach((column) => {
      const values = data.rows.map((row) => row[column]).filter(Boolean)
      const uniqueValues = [...new Set(values)]

      // Check for common encoding patterns
      if (uniqueValues.length > 1 && uniqueValues.length <= 10) {
        if (uniqueValues.every((val) => /^[0-9]+$/.test(val))) {
          encoded[column] = {
            type: "numeric_encoding",
            description: "Appears to be numerically encoded categorical data",
            uniqueCount: uniqueValues.length,
            sample: uniqueValues.slice(0, 5),
            recommendation: "Consider label decoding or mapping to meaningful categories",
          }
        } else if (uniqueValues.every((val) => /^[A-Z]{2,5}$/.test(val))) {
          encoded[column] = {
            type: "code_encoding",
            description: "Appears to be coded with abbreviations or codes",
            uniqueCount: uniqueValues.length,
            sample: uniqueValues.slice(0, 5),
            recommendation: "Map codes to full descriptions for better interpretability",
          }
        }
      }
    })

    return encoded
  }

  const calculatePearsonCorrelation = (x, y) => {
    const n = Math.min(x.length, y.length)
    if (n === 0) return 0

    const sumX = x.slice(0, n).reduce((a, b) => a + b, 0)
    const sumY = y.slice(0, n).reduce((a, b) => a + b, 0)
    const sumXY = x.slice(0, n).reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.slice(0, n).reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.slice(0, n).reduce((sum, yi) => sum + yi * yi, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  const getCorrelationStrength = (correlation) => {
    if (correlation >= 0.8) return "Very Strong"
    if (correlation >= 0.6) return "Strong"
    if (correlation >= 0.4) return "Moderate"
    if (correlation >= 0.2) return "Weak"
    return "Very Weak"
  }

  const performEnhancedSegmentAnalysis = () => {
    const segments = {}
    const categoricalCols = analysisResults?.basic?.categoricalColumns || []
    const numericCols = data.summary?.numericColumns || []

    categoricalCols.forEach((catCol) => {
      const segmentData = {}
      const uniqueValues = [...new Set(data.rows.map((row) => row[catCol]).filter(Boolean))]

      uniqueValues.forEach((segment) => {
        const segmentRows = data.rows.filter((row) => row[catCol] === segment)

        segmentData[segment] = {
          count: segmentRows.length,
          percentage: ((segmentRows.length / data.rows.length) * 100).toFixed(1),
          numericSummary: {},
        }

        // Calculate numeric summaries for each segment
        numericCols.forEach((numCol) => {
          const values = segmentRows.map((row) => Number.parseFloat(row[numCol])).filter((val) => !isNaN(val))

          if (values.length > 0) {
            segmentData[segment].numericSummary[numCol] = {
              total: values.reduce((a, b) => a + b, 0).toFixed(2),
              average: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
              count: values.length,
            }
          }
        })
      })

      if (Object.keys(segmentData).length > 0) {
        segments[catCol] = segmentData
      }
    })

    return segments
  }

  const generateEnhancedInsights = (basic, correlations, segments, sales) => {
    const insights = {
      dataOverview: {
        totalRecords: data.rows.length,
        totalColumns: data.headers.length,
        dataQuality: basic.dataQuality.completeness,
        numericColumns: basic.numericColumns.length,
        categoricalColumns: basic.categoricalColumns.length,
      },
      keyFindings: [],
      recommendations: [],
      dataQualityIssues: [],
    }

    // Add sales insights
    if (Object.keys(sales).length > 0) {
      insights.keyFindings.push("Sales analysis reveals performance variations across different segments")
      insights.recommendations.push("Focus on high-performing segments identified in the sales analysis")
    }

    // Add correlation insights
    const strongCorrelations = correlations.filter((c) => Math.abs(Number.parseFloat(c.correlation)) > 0.7)
    if (strongCorrelations.length > 0) {
      insights.keyFindings.push(
        `Found ${strongCorrelations.length} strong correlations that could be used for predictive modeling`,
      )
    }

    // Data quality insights
    if (basic.dataQuality.completeness < 90) {
      insights.dataQualityIssues.push("Data completeness is below 90% - consider data cleaning")
    }

    return insights
  }

  const handleUserDecoding = (column, mappings) => {
    setUserDecodingMappings((prev) => ({
      ...prev,
      [column]: mappings,
    }))

    setPendingDecodingColumns((prev) => prev.filter((col) => col !== column))
    addToLog(`User provided decoding for ${column}`, "success")
  }

  const addToLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString()
    setAnalysisLog((prev) => [...prev, { message, type, timestamp }])
  }

  const decodeColumn = async (column) => {
    if (!data || !column) return

    addToLog(`Analyzing encoding patterns in ${column}...`, "info")

    const values = data.rows.map((row) => row[column]).filter(Boolean)
    const uniqueValues = [...new Set(values)]
    const valueCounts = {}

    values.forEach((val) => {
      valueCounts[val] = (valueCounts[val] || 0) + 1
    })

    // Generate mock decoded mappings
    const decodedMapping = {}
    uniqueValues.forEach((val, index) => {
      if (/^[0-9]+$/.test(val)) {
        // Numeric codes
        const categories = ["Premium", "Standard", "Basic", "Enterprise", "Starter"]
        decodedMapping[val] = categories[index % categories.length]
      } else if (/^[A-Z]{2,5}$/.test(val)) {
        // Letter codes
        const expansions = {
          US: "United States",
          UK: "United Kingdom",
          CA: "Canada",
          AU: "Australia",
          DE: "Germany",
          FR: "France",
          JP: "Japan",
          CN: "China",
          IN: "India",
          BR: "Brazil",
        }
        decodedMapping[val] = expansions[val] || `${val} (Expanded)`
      } else {
        decodedMapping[val] = val.replace(/_/g, " ").replace(/-/g, " ")
      }
    })

    const decodingResult = {
      originalValues: uniqueValues,
      decodedMapping,
      valueCounts,
      confidence: uniqueValues.length <= 20 ? "High" : "Medium",
      recommendation: uniqueValues.length <= 10 ? "Apply one-hot encoding" : "Use label encoding",
    }

    setDecodingResults((prev) => ({ ...prev, [column]: decodingResult }))
    addToLog(`Decoding analysis completed for ${column}`, "success")
  }

  const exportAnalysis = () => {
    if (!analysisResults) return

    const exportData = {
      ...analysisResults,
      decodingResults,
      userDecodingMappings,
      salesAnalysis,
      predictions,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `data-analysis-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    addToLog("Analysis results exported successfully", "success")
  }

  if (!data || !data.headers || !data.rows) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6 text-center">
          <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No data available for analysis. Please upload a dataset first.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-green-900 flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Enhanced Data Analytics Dashboard
              </CardTitle>
              <CardDescription className="text-green-700">
                Comprehensive analysis with sales insights, correlations, and predictions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={runAutomaticAnalysis} disabled={processing} className="bg-green-600 hover:bg-green-700">
                <RefreshCw className={`h-4 w-4 mr-2 ${processing ? "animate-spin" : ""}`} />
                {processing ? "Analyzing..." : "Refresh Analysis"}
              </Button>
              <Button onClick={exportAnalysis} variant="outline" disabled={!analysisResults}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Processing Progress */}
      {processing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Analysis Progress</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="max-h-32 overflow-y-auto space-y-1">
                {analysisLog.slice(-3).map((log, index) => (
                  <div key={index} className="text-xs flex items-center gap-2">
                    <span className="text-gray-400">{log.timestamp}</span>
                    <span
                      className={
                        log.type === "error"
                          ? "text-red-600"
                          : log.type === "success"
                            ? "text-green-600"
                            : "text-gray-600"
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Decoding Dialog */}
      {pendingDecodingColumns.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>
                Found {pendingDecodingColumns.length} encoded column(s) that need user input for proper decoding.
              </span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                    <Settings className="h-4 w-4 mr-2" />
                    Decode Columns
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Decode Encoded Columns</DialogTitle>
                    <DialogDescription>
                      Help us understand what these encoded values represent in your data.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {pendingDecodingColumns.map((column) => {
                      const uniqueValues = [...new Set(data.rows.map((row) => row[column]).filter(Boolean))]
                      return (
                        <div key={column} className="space-y-4 p-4 border rounded-lg">
                          <h4 className="font-medium">Column: {column}</h4>
                          <p className="text-sm text-gray-600">Found values: {uniqueValues.join(", ")}</p>
                          <div className="grid gap-2">
                            {uniqueValues.map((value) => (
                              <div key={value} className="flex items-center gap-2">
                                <Label className="w-16">{value}:</Label>
                                <Input
                                  placeholder={`What does "${value}" represent?`}
                                  onChange={(e) => {
                                    const mappings = userDecodingMappings[column] || {}
                                    mappings[value] = e.target.value
                                    setUserDecodingMappings((prev) => ({
                                      ...prev,
                                      [column]: mappings,
                                    }))
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleUserDecoding(column, userDecodingMappings[column] || {})}
                            disabled={
                              !userDecodingMappings[column] ||
                              Object.keys(userDecodingMappings[column]).length !== uniqueValues.length
                            }
                          >
                            Apply Decoding
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Analysis Tabs */}
      {analysisResults && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
            <TabsTrigger value="correlations">Correlations</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="decoding">Decoding</TabsTrigger>
          </TabsList>

          {/* Sales Analysis Tab */}
          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Sales Performance Analysis
                </CardTitle>
                <CardDescription>Total sales, revenue, and performance metrics by category</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(salesAnalysis).length > 0 ? (
                  <Tabs defaultValue={Object.keys(salesAnalysis)[0]} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      {Object.keys(salesAnalysis).map((column) => (
                        <TabsTrigger key={column} value={column} className="text-sm">
                          By {column.replace(/_/g, " ")}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {Object.entries(salesAnalysis).map(([column, categories]) => (
                      <TabsContent key={column} value={column} className="space-y-4">
                        <div className="grid gap-4">
                          {Object.entries(categories).map(([category, metrics]) => (
                            <Card key={category} className="border-blue-200">
                              <CardHeader>
                                <CardTitle className="text-lg text-blue-900">
                                  {userDecodingMappings[column]?.[category] || category}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid md:grid-cols-3 gap-4">
                                  {Object.entries(metrics).map(([salesCol, data]) => (
                                    <div key={salesCol} className="space-y-2">
                                      <h4 className="font-medium text-sm">{salesCol.replace(/_/g, " ")}</h4>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-green-50 p-2 rounded">
                                          <div className="font-bold text-green-600">${data.total}</div>
                                          <div className="text-gray-600">Total</div>
                                        </div>
                                        <div className="bg-blue-50 p-2 rounded">
                                          <div className="font-bold text-blue-600">${data.average}</div>
                                          <div className="text-gray-600">Average</div>
                                        </div>
                                        <div className="bg-purple-50 p-2 rounded">
                                          <div className="font-bold text-purple-600">{data.count}</div>
                                          <div className="text-gray-600">Count</div>
                                        </div>
                                        <div className="bg-orange-50 p-2 rounded">
                                          <div className="font-bold text-orange-600">{data.percentage}%</div>
                                          <div className="text-gray-600">Share</div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="text-center py-8">
                    <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No sales data detected in the dataset.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Correlations Tab */}
          <TabsContent value="correlations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  Correlation Analysis with Explanations
                </CardTitle>
                <CardDescription>Relationships between variables with business implications</CardDescription>
              </CardHeader>
              <CardContent>
                {correlationResults.length > 0 ? (
                  <div className="space-y-4">
                    {correlationResults.map((corr, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={Math.abs(Number.parseFloat(corr.correlation)) > 0.7 ? "default" : "secondary"}
                              >
                                {corr.strength}
                              </Badge>
                              <span className="font-medium">
                                {corr.column1} ↔ {corr.column2}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">{corr.correlation}</div>
                              <div className="text-sm text-gray-500">{corr.direction}</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="text-sm text-gray-700">
                              <strong>Explanation:</strong> {corr.explanation}
                            </div>
                            <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                              <strong>Business Implication:</strong> {corr.businessImplication}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No correlations found in the dataset.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Sales Predictions & Forecasting
                </CardTitle>
                <CardDescription>Predictive analysis for sales performance by category</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(predictions).length > 0 ? (
                  <Tabs defaultValue={Object.keys(predictions)[0]} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      {Object.keys(predictions).map((column) => (
                        <TabsTrigger key={column} value={column} className="text-sm">
                          {column.replace(/_/g, " ")}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {Object.entries(predictions).map(([column, salesCols]) => (
                      <TabsContent key={column} value={column} className="space-y-4">
                        {Object.entries(salesCols).map(([salesCol, categoryPreds]) => (
                          <Card key={salesCol} className="border-purple-200">
                            <CardHeader>
                              <CardTitle className="text-lg text-purple-900">
                                {salesCol.replace(/_/g, " ")} Predictions
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid gap-4">
                                {Object.entries(categoryPreds).map(([category, pred]) => (
                                  <div
                                    key={category}
                                    className="flex items-center justify-between p-3 bg-purple-50 rounded border border-purple-200"
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {userDecodingMappings[column]?.[category] || category}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        Current Avg: ${pred.currentAverage} | Trend: {pred.trend}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-purple-600 text-lg">
                                        ${pred.nextPeriodPrediction}
                                      </div>
                                      <div className="text-sm">
                                        <Badge
                                          variant={
                                            pred.confidence === "High"
                                              ? "default"
                                              : pred.confidence === "Medium"
                                                ? "secondary"
                                                : "outline"
                                          }
                                        >
                                          {pred.confidence} Confidence
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">
                      Insufficient data for predictions. Need at least 3 data points per category.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ... existing code for other tabs ... */}

          <TabsContent value="segments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Segment Analysis by Category
                </CardTitle>
                <CardDescription>Sales performance breakdown by different categorical variables</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(segmentAnalysis).length > 0 ? (
                  <Tabs defaultValue={Object.keys(segmentAnalysis)[0]} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      {segmentAnalysis && Object.keys(segmentAnalysis).length > 0 ? (
                        Object.keys(segmentAnalysis).map((column) => (
                          <TabsTrigger key={column} value={column} className="text-sm">
                            {column.replace(/_/g, " ")}
                          </TabsTrigger>
                        ))
                      ) : (
                        <TabsTrigger value="no-data" className="text-sm">
                          No Segments Available
                        </TabsTrigger>
                      )}
                    </TabsList>

                    {segmentAnalysis && Object.keys(segmentAnalysis).length > 0 ? (
                      Object.entries(segmentAnalysis).map(([column, segments]) => (
                        <TabsContent key={column} value={column} className="space-y-4">
                          <div className="grid gap-4">
                            {segments &&
                              Object.entries(segments).map(([segment, segmentData]) => (
                                <Card key={segment} className="border-green-200">
                                  <CardHeader>
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-lg text-green-900">{segment}</CardTitle>
                                      <Badge className="bg-green-100 text-green-800 border-green-300">
                                        {segmentData?.percentage || 0}% of total
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid md:grid-cols-3 gap-4">
                                      <div className="text-center p-3 bg-green-50 rounded border border-green-200">
                                        <div className="text-lg font-bold text-green-600">
                                          {segmentData?.count || 0}
                                        </div>
                                        <div className="text-sm text-gray-600">Records</div>
                                      </div>
                                      {segmentData?.numericSummary &&
                                        Object.entries(segmentData.numericSummary)
                                          .slice(0, 2)
                                          .map(([numCol, summary]) => (
                                            <div
                                              key={numCol}
                                              className="text-center p-3 bg-emerald-50 rounded border border-emerald-200"
                                            >
                                              <div className="text-lg font-bold text-emerald-600">
                                                {summary?.total || 0}
                                              </div>
                                              <div className="text-sm text-gray-600">
                                                Total {numCol.replace(/_/g, " ")}
                                              </div>
                                            </div>
                                          ))}
                                    </div>

                                    {segmentData?.numericSummary &&
                                      Object.keys(segmentData.numericSummary).length > 0 && (
                                        <div className="mt-4">
                                          <h4 className="font-medium mb-2">Numeric Breakdown</h4>
                                          <div className="grid md:grid-cols-2 gap-2">
                                            {Object.entries(segmentData.numericSummary).map(([numCol, summary]) => (
                                              <div
                                                key={numCol}
                                                className="flex justify-between p-2 bg-gray-50 rounded text-sm"
                                              >
                                                <span>{numCol.replace(/_/g, " ")}:</span>
                                                <span className="font-medium">Avg: {summary?.average || 0}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </TabsContent>
                      ))
                    ) : (
                      <TabsContent value="no-data" className="space-y-4">
                        <Card className="border-gray-200">
                          <CardContent className="p-6 text-center">
                            <p className="text-gray-500">No segment analysis available for this dataset.</p>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}
                  </Tabs>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No categorical data available for segment analysis.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Data Overview Cards */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 text-center">
                  <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-900">{analysisResults.metadata.totalRows}</div>
                  <div className="text-sm text-blue-700">Total Records</div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-900">{analysisResults.metadata.totalColumns}</div>
                  <div className="text-sm text-green-700">Total Columns</div>
                </CardContent>
              </Card>
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-900">
                    {analysisResults.basic.dataQuality.completeness.toFixed(1)}%
                  </div>
                  <div className="text-sm text-purple-700">Data Quality</div>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4 text-center">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-900">
                    {analysisResults.insights.keyFindings.length}
                  </div>
                  <div className="text-sm text-orange-700">Key Insights</div>
                </CardContent>
              </Card>
            </div>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  Key Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResults.insights.keyFindings.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-green-800">Key Findings</h4>
                      <ul className="space-y-1">
                        {analysisResults.insights.keyFindings.map((finding, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResults.insights.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-blue-800">Recommendations</h4>
                      <ul className="space-y-1">
                        {analysisResults.insights.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysisResults.insights.dataQualityIssues.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-800">Data Quality Issues</h4>
                      <ul className="space-y-1">
                        {analysisResults.insights.dataQualityIssues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Column Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Column Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Column</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Summary</TableHead>
                        <TableHead>Missing Values</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.headers.map((column) => (
                        <TableRow key={column}>
                          <TableCell className="font-medium">{column}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                analysisResults.basic.columnTypes[column] === "numeric" ? "default" : "secondary"
                              }
                            >
                              {analysisResults.basic.columnTypes[column]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {analysisResults.basic.columnTypes[column] === "numeric" ? (
                              <div>
                                Min: {analysisResults.basic.summary[column]?.min?.toFixed(2)} | Max:{" "}
                                {analysisResults.basic.summary[column]?.max?.toFixed(2)} | Avg:{" "}
                                {analysisResults.basic.summary[column]?.mean?.toFixed(2)}
                              </div>
                            ) : (
                              <div>
                                {analysisResults.basic.summary[column]?.uniqueCount} unique values | Most common:{" "}
                                {analysisResults.basic.summary[column]?.mostCommon}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                analysisResults.basic.dataQuality.missingValues[column] > 0 ? "destructive" : "default"
                              }
                            >
                              {analysisResults.basic.dataQuality.missingValues[column]}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Decoding Tab */}
          <TabsContent value="decoding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-indigo-600" />
                  Data Decoding & Interpretation
                </CardTitle>
                <CardDescription>Decode encoded values and improve data interpretability</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(decodingResults).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(decodingResults).map(([column, result]) => (
                      <Card key={column} className="border-indigo-200">
                        <CardHeader>
                          <CardTitle className="text-lg text-indigo-900">{column}</CardTitle>
                          <CardDescription>{result.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Original Values</h4>
                              <div className="flex flex-wrap gap-2">
                                {result.sample.map((value) => (
                                  <Badge key={value} variant="outline">
                                    {value}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {userDecodingMappings[column] && (
                              <div>
                                <h4 className="font-medium mb-2">User-Defined Mappings</h4>
                                <div className="grid md:grid-cols-2 gap-2">
                                  {Object.entries(userDecodingMappings[column]).map(([original, decoded]) => (
                                    <div
                                      key={original}
                                      className="flex items-center justify-between p-2 bg-indigo-50 rounded"
                                    >
                                      <Badge variant="outline">{original}</Badge>
                                      <span>→</span>
                                      <span className="font-medium">{decoded}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between">
                              <div>
                                <Badge className="bg-indigo-100 text-indigo-800">{result.confidence} Confidence</Badge>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => decodeColumn(column)}
                                className="bg-indigo-600 hover:bg-indigo-700"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Auto-Decode
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No encoded columns detected in the dataset.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
