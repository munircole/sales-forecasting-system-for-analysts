"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Settings,
  Play,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Filter,
  Zap,
  BarChart3,
  TrendingUp,
  Copy,
  Eye,
} from "lucide-react"

export default function DataPreprocessing({ data, onDataProcessed }) {
  const [processingOptions, setProcessingOptions] = useState({
    // Data Cleaning
    removeDuplicates: true,
    handleMissing: "mean",
    removeOutliers: false,
    outlierMethod: "iqr",
    outlierThreshold: 1.5,

    // Feature Engineering
    createTimeFeatures: false,
    createLagFeatures: false,
    lagPeriods: [1, 7, 30],
    createRollingFeatures: false,
    rollingWindows: [7, 14, 30],
    createInteractionFeatures: false,
    maxInteractions: 3,

    // Feature Selection
    enableFeatureSelection: false,
    selectionMethod: "correlation",
    correlationThreshold: 0.95,
    varianceThreshold: 0.01,
    selectedFeatures: [],

    // Scaling
    scaleFeatures: false,
    scalingMethod: "minmax",

    // Encoding
    encodeCategorical: "label",
  })

  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processedData, setProcessedData] = useState(null)
  const [processingLog, setProcessingLog] = useState([])
  const [previewData, setPreviewData] = useState(null)
  const [duplicateStats, setDuplicateStats] = useState(null)
  const [featureStats, setFeatureStats] = useState(null)
  const [correlationMatrix, setCorrelationMatrix] = useState(null)

  useEffect(() => {
    if (data) {
      analyzeDataQuality()
      if (data.summary.numericColumns.length > 0) {
        setProcessingOptions((prev) => ({
          ...prev,
          selectedFeatures: data.summary.numericColumns,
        }))
      }
    }
  }, [data])

  const analyzeDataQuality = () => {
    if (!data) return

    // Analyze duplicates
    const duplicates = findDuplicates(data.rows)
    setDuplicateStats({
      total: duplicates.length,
      percentage: ((duplicates.length / data.rows.length) * 100).toFixed(2),
    })

    // Analyze features
    const stats = analyzeFeatures(data)
    setFeatureStats(stats)

    // Calculate correlation matrix
    if (data.summary.numericColumns.length > 1) {
      const corrMatrix = calculateCorrelationMatrix(data)
      setCorrelationMatrix(corrMatrix)
    }
  }

  const findDuplicates = (rows) => {
    const seen = new Set()
    const duplicates = []

    rows.forEach((row, index) => {
      const rowString = JSON.stringify(row)
      if (seen.has(rowString)) {
        duplicates.push(index)
      } else {
        seen.add(rowString)
      }
    })

    return duplicates
  }

  const analyzeFeatures = (data) => {
    const stats = {}

    data.summary.numericColumns.forEach((column) => {
      const values = data.rows.map((row) => Number.parseFloat(row[column])).filter((val) => !isNaN(val))
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length

      stats[column] = {
        mean: mean.toFixed(2),
        variance: variance.toFixed(4),
        missing: data.rows.filter((row) => !row[column] || row[column] === "").length,
        unique: new Set(values).size,
        zeros: values.filter((val) => val === 0).length,
      }
    })

    return stats
  }

  const calculateCorrelationMatrix = (data) => {
    const numericCols = data.summary.numericColumns.slice(0, 8) // Limit for performance
    const matrix = {}

    numericCols.forEach((col1) => {
      matrix[col1] = {}
      numericCols.forEach((col2) => {
        const values1 = data.rows.map((row) => Number.parseFloat(row[col1])).filter((val) => !isNaN(val))
        const values2 = data.rows.map((row) => Number.parseFloat(row[col2])).filter((val) => !isNaN(val))

        if (col1 === col2) {
          matrix[col1][col2] = 1
        } else {
          const correlation = calculateCorrelation(values1, values2)
          matrix[col1][col2] = correlation
        }
      })
    })

    return matrix
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

  const addToLog = (message, type = "info") => {
    setProcessingLog((prev) => [
      ...prev,
      {
        message,
        type,
        timestamp: new Date().toLocaleTimeString(),
      },
    ])
  }

  const removeDuplicates = (rows) => {
    addToLog("Removing duplicate rows...")
    const seen = new Set()
    const uniqueRows = []

    rows.forEach((row) => {
      const rowString = JSON.stringify(row)
      if (!seen.has(rowString)) {
        seen.add(rowString)
        uniqueRows.push(row)
      }
    })

    addToLog(`Removed ${rows.length - uniqueRows.length} duplicate rows`)
    return uniqueRows
  }

  const handleMissingValues = (rows, headers, method) => {
    addToLog(`Handling missing values using ${method} method`)

    const processedRows = rows.map((row) => {
      const newRow = { ...row }

      headers.forEach((header) => {
        if (!newRow[header] || newRow[header] === "" || newRow[header] === "null") {
          const columnValues = rows.map((r) => r[header]).filter((val) => val && val !== "" && val !== "null")

          if (columnValues.length === 0) return

          const isNumeric = columnValues.every((val) => !isNaN(Number.parseFloat(val)))

          if (isNumeric) {
            const numericValues = columnValues.map((val) => Number.parseFloat(val))
            switch (method) {
              case "mean":
                newRow[header] = (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2)
                break
              case "median":
                const sorted = numericValues.sort((a, b) => a - b)
                newRow[header] = sorted[Math.floor(sorted.length / 2)].toString()
                break
              case "mode":
                const mode = numericValues
                  .sort(
                    (a, b) => numericValues.filter((v) => v === a).length - numericValues.filter((v) => v === b).length,
                  )
                  .pop()
                newRow[header] = mode.toString()
                break
              case "forward_fill":
                // Use previous non-null value
                newRow[header] = newRow[header] || "0"
                break
              default:
                newRow[header] = "0"
            }
          } else {
            const counts = {}
            columnValues.forEach((val) => {
              counts[val] = (counts[val] || 0) + 1
            })
            const mode = Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b))
            newRow[header] = mode
          }
        }
      })

      return newRow
    })

    return processedRows
  }

  const removeOutliers = (rows, headers, method, threshold) => {
    addToLog(`Removing outliers using ${method} method (threshold: ${threshold})`)

    const numericColumns = headers.filter((header) => {
      const sample = rows.slice(0, 10).map((row) => row[header])
      return sample.every((val) => !isNaN(Number.parseFloat(val)) && isFinite(val))
    })

    let filteredRows = [...rows]
    let totalRemoved = 0

    numericColumns.forEach((column) => {
      const beforeCount = filteredRows.length
      const values = filteredRows.map((row) => Number.parseFloat(row[column])).filter((val) => !isNaN(val))

      if (method === "iqr") {
        values.sort((a, b) => a - b)
        const q1 = values[Math.floor(values.length * 0.25)]
        const q3 = values[Math.floor(values.length * 0.75)]
        const iqr = q3 - q1
        const lowerBound = q1 - threshold * iqr
        const upperBound = q3 + threshold * iqr

        filteredRows = filteredRows.filter((row) => {
          const value = Number.parseFloat(row[column])
          return value >= lowerBound && value <= upperBound
        })
      } else if (method === "zscore") {
        const mean = values.reduce((a, b) => a + b, 0) / values.length
        const std = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length)

        filteredRows = filteredRows.filter((row) => {
          const value = Number.parseFloat(row[column])
          const zscore = Math.abs((value - mean) / std)
          return zscore <= threshold
        })
      }

      const removed = beforeCount - filteredRows.length
      totalRemoved += removed
    })

    addToLog(`Removed ${totalRemoved} outlier rows across all numeric columns`)
    return filteredRows
  }

  const createTimeFeatures = (rows, headers) => {
    addToLog("Creating time-based features...")

    const dateColumns = ["date", "Date", "DATE", "timestamp"]
    const dateColumn = dateColumns.find((col) => headers.includes(col))

    if (!dateColumn) {
      addToLog("No date column found, skipping time features", "warning")
      return rows
    }

    const enhancedRows = rows.map((row) => {
      const newRow = { ...row }

      if (row[dateColumn]) {
        const date = new Date(row[dateColumn])
        if (!isNaN(date.getTime())) {
          newRow["year"] = date.getFullYear()
          newRow["month"] = date.getMonth() + 1
          newRow["day"] = date.getDate()
          newRow["day_of_week"] = date.getDay()
          newRow["day_of_year"] = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))
          newRow["week_of_year"] = Math.ceil(newRow["day_of_year"] / 7)
          newRow["quarter"] = Math.floor(date.getMonth() / 3) + 1
          newRow["is_weekend"] = date.getDay() === 0 || date.getDay() === 6 ? 1 : 0
          newRow["is_month_start"] = date.getDate() === 1 ? 1 : 0
          newRow["is_month_end"] =
            date.getDate() === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() ? 1 : 0

          // Cyclical features
          newRow["month_sin"] = Math.sin((2 * Math.PI * (date.getMonth() + 1)) / 12).toFixed(4)
          newRow["month_cos"] = Math.cos((2 * Math.PI * (date.getMonth() + 1)) / 12).toFixed(4)
          newRow["day_sin"] = Math.sin((2 * Math.PI * date.getDay()) / 7).toFixed(4)
          newRow["day_cos"] = Math.cos((2 * Math.PI * date.getDay()) / 7).toFixed(4)
        }
      }

      return newRow
    })

    addToLog("Created 14 time-based features")
    return enhancedRows
  }

  const createLagFeatures = (rows, numericColumns, lagPeriods) => {
    addToLog(`Creating lag features for periods: ${lagPeriods.join(", ")}`)

    const enhancedRows = [...rows]

    numericColumns.slice(0, 3).forEach((column) => {
      // Limit to first 3 columns for performance
      lagPeriods.forEach((lag) => {
        enhancedRows.forEach((row, index) => {
          if (index >= lag) {
            row[`${column}_lag_${lag}`] = enhancedRows[index - lag][column]
          } else {
            row[`${column}_lag_${lag}`] = row[column] // Use current value for early rows
          }
        })
      })
    })

    addToLog(`Created ${numericColumns.slice(0, 3).length * lagPeriods.length} lag features`)
    return enhancedRows
  }

  const createRollingFeatures = (rows, numericColumns, windows) => {
    addToLog(`Creating rolling features for windows: ${windows.join(", ")}`)

    const enhancedRows = [...rows]

    numericColumns.slice(0, 2).forEach((column) => {
      // Limit for performance
      windows.forEach((window) => {
        enhancedRows.forEach((row, index) => {
          const start = Math.max(0, index - window + 1)
          const windowValues = enhancedRows
            .slice(start, index + 1)
            .map((r) => Number.parseFloat(r[column]))
            .filter((val) => !isNaN(val))

          if (windowValues.length > 0) {
            const mean = windowValues.reduce((a, b) => a + b, 0) / windowValues.length
            const variance = windowValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / windowValues.length

            row[`${column}_rolling_mean_${window}`] = mean.toFixed(4)
            row[`${column}_rolling_std_${window}`] = Math.sqrt(variance).toFixed(4)
            row[`${column}_rolling_min_${window}`] = Math.min(...windowValues).toFixed(4)
            row[`${column}_rolling_max_${window}`] = Math.max(...windowValues).toFixed(4)
          }
        })
      })
    })

    addToLog(`Created ${numericColumns.slice(0, 2).length * windows.length * 4} rolling features`)
    return enhancedRows
  }

  const createInteractionFeatures = (rows, numericColumns, maxInteractions) => {
    addToLog(`Creating interaction features (max: ${maxInteractions})`)

    const enhancedRows = rows.map((row) => {
      const newRow = { ...row }
      const limitedColumns = numericColumns.slice(0, maxInteractions)

      for (let i = 0; i < limitedColumns.length; i++) {
        for (let j = i + 1; j < limitedColumns.length; j++) {
          const col1 = limitedColumns[i]
          const col2 = limitedColumns[j]
          const val1 = Number.parseFloat(row[col1]) || 0
          const val2 = Number.parseFloat(row[col2]) || 0

          // Multiplication
          newRow[`${col1}_x_${col2}`] = (val1 * val2).toFixed(4)

          // Division (avoid division by zero)
          if (val2 !== 0) {
            newRow[`${col1}_div_${col2}`] = (val1 / val2).toFixed(4)
          }

          // Addition
          newRow[`${col1}_plus_${col2}`] = (val1 + val2).toFixed(4)

          // Difference
          newRow[`${col1}_minus_${col2}`] = (val1 - val2).toFixed(4)
        }
      }

      return newRow
    })

    const interactionCount = ((maxInteractions * (maxInteractions - 1)) / 2) * 4
    addToLog(`Created ${interactionCount} interaction features`)
    return enhancedRows
  }

  const selectFeatures = (rows, headers, method, threshold, selectedFeatures) => {
    addToLog(`Applying feature selection using ${method} method`)

    let finalFeatures = [...selectedFeatures]

    if (method === "correlation" && correlationMatrix) {
      // Remove highly correlated features
      const toRemove = new Set()
      Object.keys(correlationMatrix).forEach((col1) => {
        Object.keys(correlationMatrix[col1]).forEach((col2) => {
          if (col1 !== col2 && Math.abs(correlationMatrix[col1][col2]) > threshold && !toRemove.has(col1)) {
            toRemove.add(col2)
          }
        })
      })

      finalFeatures = finalFeatures.filter((feature) => !toRemove.has(feature))
      addToLog(`Removed ${toRemove.size} highly correlated features`)
    } else if (method === "variance") {
      // Remove low variance features
      const lowVarianceFeatures = []
      finalFeatures.forEach((feature) => {
        const values = rows.map((row) => Number.parseFloat(row[feature])).filter((val) => !isNaN(val))
        const mean = values.reduce((a, b) => a + b, 0) / values.length
        const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length

        if (variance < threshold) {
          lowVarianceFeatures.push(feature)
        }
      })

      finalFeatures = finalFeatures.filter((feature) => !lowVarianceFeatures.includes(feature))
      addToLog(`Removed ${lowVarianceFeatures.length} low variance features`)
    }

    // Filter rows to only include selected features and non-numeric columns
    const filteredRows = rows.map((row) => {
      const newRow = {}
      Object.keys(row).forEach((key) => {
        if (finalFeatures.includes(key) || !data.summary.numericColumns.includes(key)) {
          newRow[key] = row[key]
        }
      })
      return newRow
    })

    return { rows: filteredRows, features: finalFeatures }
  }

  const scaleFeatures = (rows, numericColumns, method) => {
    addToLog(`Scaling features using ${method} method`)

    const scaledRows = rows.map((row) => {
      const newRow = { ...row }

      numericColumns.forEach((column) => {
        const values = rows.map((r) => Number.parseFloat(r[column])).filter((val) => !isNaN(val))
        const value = Number.parseFloat(row[column])

        if (!isNaN(value) && values.length > 0) {
          if (method === "minmax") {
            const min = Math.min(...values)
            const max = Math.max(...values)
            if (max !== min) {
              newRow[column] = ((value - min) / (max - min)).toFixed(4)
            }
          } else if (method === "standard") {
            const mean = values.reduce((a, b) => a + b, 0) / values.length
            const std = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length)
            if (std !== 0) {
              newRow[column] = ((value - mean) / std).toFixed(4)
            }
          }
        }
      })

      return newRow
    })

    return scaledRows
  }

  const encodeCategorical = (rows, headers, method) => {
    addToLog(`Encoding categorical variables using ${method} encoding`)

    const categoricalColumns = headers.filter((header) => {
      const sample = rows.slice(0, 10).map((row) => row[header])
      return !sample.every((val) => !isNaN(Number.parseFloat(val)) && isFinite(val))
    })

    let encodedRows = rows.map((row) => ({ ...row }))

    categoricalColumns.forEach((column) => {
      if (method === "label") {
        const uniqueValues = [...new Set(rows.map((r) => r[column]))]
        const encoding = {}
        uniqueValues.forEach((val, idx) => {
          encoding[val] = idx
        })
        encodedRows.forEach((row) => {
          row[column] = encoding[row[column]] || 0
        })
      } else if (method === "onehot") {
        const uniqueValues = [...new Set(rows.map((r) => r[column]))]
        encodedRows = encodedRows.map((row) => {
          const newRow = { ...row }
          uniqueValues.forEach((val) => {
            newRow[`${column}_${val}`] = row[column] === val ? 1 : 0
          })
          delete newRow[column]
          return newRow
        })
      }
    })

    return encodedRows
  }

  const processData = async () => {
    if (!data) return

    setProcessing(true)
    setProgress(0)
    setProcessingLog([])

    try {
      let processedRows = [...data.rows]
      let processedHeaders = [...data.headers]
      const totalSteps = 10
      let currentStep = 0

      addToLog("Starting comprehensive data preprocessing...", "info")

      // Step 1: Remove duplicates
      if (processingOptions.removeDuplicates) {
        processedRows = removeDuplicates(processedRows)
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // Step 2: Handle missing values
      if (processingOptions.handleMissing !== "none") {
        processedRows = handleMissingValues(processedRows, processedHeaders, processingOptions.handleMissing)
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // Step 3: Remove outliers
      if (processingOptions.removeOutliers) {
        processedRows = removeOutliers(
          processedRows,
          processedHeaders,
          processingOptions.outlierMethod,
          processingOptions.outlierThreshold,
        )
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // Step 4: Create time features
      if (processingOptions.createTimeFeatures) {
        processedRows = createTimeFeatures(processedRows, processedHeaders)
        processedHeaders = Object.keys(processedRows[0] || {})
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // Step 5: Create lag features
      if (processingOptions.createLagFeatures) {
        const numericCols = processedHeaders.filter((header) => {
          const sample = processedRows.slice(0, 10).map((row) => row[header])
          return sample.every((val) => !isNaN(Number.parseFloat(val)) && isFinite(val))
        })
        processedRows = createLagFeatures(processedRows, numericCols, processingOptions.lagPeriods)
        processedHeaders = Object.keys(processedRows[0] || {})
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // Step 6: Create rolling features
      if (processingOptions.createRollingFeatures) {
        const numericCols = processedHeaders.filter((header) => {
          const sample = processedRows.slice(0, 10).map((row) => row[header])
          return sample.every((val) => !isNaN(Number.parseFloat(val)) && isFinite(val))
        })
        processedRows = createRollingFeatures(processedRows, numericCols, processingOptions.rollingWindows)
        processedHeaders = Object.keys(processedRows[0] || {})
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // Step 7: Create interaction features
      if (processingOptions.createInteractionFeatures) {
        const numericCols = processedHeaders.filter((header) => {
          const sample = processedRows.slice(0, 10).map((row) => row[header])
          return sample.every((val) => !isNaN(Number.parseFloat(val)) && isFinite(val))
        })
        processedRows = createInteractionFeatures(processedRows, numericCols, processingOptions.maxInteractions)
        processedHeaders = Object.keys(processedRows[0] || {})
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // Step 8: Feature selection
      if (processingOptions.enableFeatureSelection) {
        const result = selectFeatures(
          processedRows,
          processedHeaders,
          processingOptions.selectionMethod,
          processingOptions.correlationThreshold,
          processingOptions.selectedFeatures,
        )
        processedRows = result.rows
        processedHeaders = Object.keys(processedRows[0] || {})
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // Step 9: Encode categorical variables
      if (processingOptions.encodeCategorical !== "none") {
        processedRows = encodeCategorical(processedRows, processedHeaders, processingOptions.encodeCategorical)
        processedHeaders = Object.keys(processedRows[0] || {})
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // Step 10: Scale features
      if (processingOptions.scaleFeatures) {
        const numericColumns = processedHeaders.filter((header) => {
          const sample = processedRows.slice(0, 10).map((row) => row[header])
          return sample.every((val) => !isNaN(Number.parseFloat(val)) && isFinite(val))
        })
        processedRows = scaleFeatures(processedRows, numericColumns, processingOptions.scalingMethod)
        currentStep++
        setProgress((currentStep / totalSteps) * 100)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      const finalData = {
        ...data,
        headers: processedHeaders,
        rows: processedRows,
        summary: {
          ...data.summary,
          totalRows: processedRows.length,
          columns: processedHeaders.length,
          numericColumns: processedHeaders.filter((header) => {
            const sample = processedRows.slice(0, 10).map((row) => row[header])
            return sample.every((val) => !isNaN(Number.parseFloat(val)) && isFinite(val))
          }),
          preprocessingApplied: processingOptions,
        },
      }

      setProcessedData(finalData)
      setPreviewData(finalData)
      onDataProcessed(finalData)
      addToLog("Data preprocessing completed successfully!", "success")
    } catch (error) {
      addToLog(`Error during preprocessing: ${error.message}`, "error")
    } finally {
      setProcessing(false)
      setProgress(100)
    }
  }

  const handleOptionChange = (option, value) => {
    setProcessingOptions((prev) => ({
      ...prev,
      [option]: value,
    }))
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Please upload data first to perform preprocessing.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Data Quality Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Rows</p>
                <p className="text-2xl font-bold text-blue-900">{data.summary.totalRows.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Duplicates</p>
                <p className="text-2xl font-bold text-green-900">
                  {duplicateStats ? `${duplicateStats.total} (${duplicateStats.percentage}%)` : "0"}
                </p>
              </div>
              <Copy className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Missing Values</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {Object.keys(data.summary.missingValues || {}).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Numeric Features</p>
                <p className="text-2xl font-bold text-purple-900">{data.summary.numericColumns.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Preprocessing Interface */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Data Preprocessing Configuration
          </CardTitle>
          <CardDescription>
            Configure comprehensive preprocessing options to clean and enhance your data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="cleaning" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="cleaning" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Data Cleaning
              </TabsTrigger>
              <TabsTrigger value="engineering" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Feature Engineering
              </TabsTrigger>
              <TabsTrigger value="selection" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Feature Selection
              </TabsTrigger>
              <TabsTrigger value="scaling" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Scaling & Encoding
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cleaning" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Duplicate Removal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="removeDuplicates"
                        checked={processingOptions.removeDuplicates}
                        onCheckedChange={(checked) => handleOptionChange("removeDuplicates", checked)}
                      />
                      <Label htmlFor="removeDuplicates" className="font-medium">
                        Remove duplicate rows
                      </Label>
                    </div>
                    {duplicateStats && (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          Found {duplicateStats.total} duplicates ({duplicateStats.percentage}% of data)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Missing Values</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Handling Strategy</Label>
                      <Select
                        value={processingOptions.handleMissing}
                        onValueChange={(value) => handleOptionChange("handleMissing", value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Keep as is</SelectItem>
                          <SelectItem value="mean">Fill with Mean</SelectItem>
                          <SelectItem value="median">Fill with Median</SelectItem>
                          <SelectItem value="mode">Fill with Mode</SelectItem>
                          <SelectItem value="forward_fill">Forward Fill</SelectItem>
                          <SelectItem value="zero">Fill with Zero</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Outlier Detection</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="removeOutliers"
                        checked={processingOptions.removeOutliers}
                        onCheckedChange={(checked) => handleOptionChange("removeOutliers", checked)}
                      />
                      <Label htmlFor="removeOutliers" className="font-medium">
                        Remove outliers
                      </Label>
                    </div>

                    {processingOptions.removeOutliers && (
                      <div className="space-y-3">
                        <div>
                          <Label>Method</Label>
                          <Select
                            value={processingOptions.outlierMethod}
                            onValueChange={(value) => handleOptionChange("outlierMethod", value)}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="iqr">IQR Method</SelectItem>
                              <SelectItem value="zscore">Z-Score Method</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Threshold</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={processingOptions.outlierThreshold}
                            onChange={(e) => handleOptionChange("outlierThreshold", Number.parseFloat(e.target.value))}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="engineering" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Time Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="createTimeFeatures"
                        checked={processingOptions.createTimeFeatures}
                        onCheckedChange={(checked) => handleOptionChange("createTimeFeatures", checked)}
                      />
                      <Label htmlFor="createTimeFeatures" className="font-medium">
                        Create time-based features
                      </Label>
                    </div>
                    <div className="text-sm text-gray-600">
                      Creates: year, month, day, day_of_week, quarter, is_weekend, cyclical features
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lag Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="createLagFeatures"
                        checked={processingOptions.createLagFeatures}
                        onCheckedChange={(checked) => handleOptionChange("createLagFeatures", checked)}
                      />
                      <Label htmlFor="createLagFeatures" className="font-medium">
                        Create lag features
                      </Label>
                    </div>
                    {processingOptions.createLagFeatures && (
                      <div>
                        <Label>Lag Periods (comma-separated)</Label>
                        <Input
                          value={processingOptions.lagPeriods.join(", ")}
                          onChange={(e) => {
                            const periods = e.target.value
                              .split(",")
                              .map((p) => Number.parseInt(p.trim()))
                              .filter((p) => !isNaN(p))
                            handleOptionChange("lagPeriods", periods)
                          }}
                          placeholder="1, 7, 30"
                          className="mt-2"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rolling Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="createRollingFeatures"
                        checked={processingOptions.createRollingFeatures}
                        onCheckedChange={(checked) => handleOptionChange("createRollingFeatures", checked)}
                      />
                      <Label htmlFor="createRollingFeatures" className="font-medium">
                        Create rolling statistics
                      </Label>
                    </div>
                    {processingOptions.createRollingFeatures && (
                      <div>
                        <Label>Window Sizes (comma-separated)</Label>
                        <Input
                          value={processingOptions.rollingWindows.join(", ")}
                          onChange={(e) => {
                            const windows = e.target.value
                              .split(",")
                              .map((w) => Number.parseInt(w.trim()))
                              .filter((w) => !isNaN(w))
                            handleOptionChange("rollingWindows", windows)
                          }}
                          placeholder="7, 14, 30"
                          className="mt-2"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Interaction Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="createInteractionFeatures"
                        checked={processingOptions.createInteractionFeatures}
                        onCheckedChange={(checked) => handleOptionChange("createInteractionFeatures", checked)}
                      />
                      <Label htmlFor="createInteractionFeatures" className="font-medium">
                        Create interaction features
                      </Label>
                    </div>
                    {processingOptions.createInteractionFeatures && (
                      <div>
                        <Label>Max Features to Interact</Label>
                        <Input
                          type="number"
                          min="2"
                          max="5"
                          value={processingOptions.maxInteractions}
                          onChange={(e) => handleOptionChange("maxInteractions", Number.parseInt(e.target.value))}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="selection" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Feature Selection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableFeatureSelection"
                      checked={processingOptions.enableFeatureSelection}
                      onCheckedChange={(checked) => handleOptionChange("enableFeatureSelection", checked)}
                    />
                    <Label htmlFor="enableFeatureSelection" className="font-medium">
                      Enable automatic feature selection
                    </Label>
                  </div>

                  {processingOptions.enableFeatureSelection && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Selection Method</Label>
                        <Select
                          value={processingOptions.selectionMethod}
                          onValueChange={(value) => handleOptionChange("selectionMethod", value)}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="correlation">Remove Highly Correlated</SelectItem>
                            <SelectItem value="variance">Remove Low Variance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>
                          {processingOptions.selectionMethod === "correlation"
                            ? "Correlation Threshold"
                            : "Variance Threshold"}
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={
                            processingOptions.selectionMethod === "correlation"
                              ? processingOptions.correlationThreshold
                              : processingOptions.varianceThreshold
                          }
                          onChange={(e) => {
                            const key =
                              processingOptions.selectionMethod === "correlation"
                                ? "correlationThreshold"
                                : "varianceThreshold"
                            handleOptionChange(key, Number.parseFloat(e.target.value))
                          }}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  )}

                  {/* Feature Selection Interface */}
                  <div>
                    <Label className="text-base font-medium">Manual Feature Selection</Label>
                    <div className="mt-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2">
                        {data.summary.numericColumns.map((column) => (
                          <div key={column} className="flex items-center space-x-2">
                            <Checkbox
                              id={`feature-${column}`}
                              checked={processingOptions.selectedFeatures.includes(column)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  handleOptionChange("selectedFeatures", [
                                    ...processingOptions.selectedFeatures,
                                    column,
                                  ])
                                } else {
                                  handleOptionChange(
                                    "selectedFeatures",
                                    processingOptions.selectedFeatures.filter((f) => f !== column),
                                  )
                                }
                              }}
                            />
                            <Label htmlFor={`feature-${column}`} className="text-sm">
                              {column}
                            </Label>
                            {featureStats && featureStats[column] && (
                              <Badge variant="outline" className="text-xs">
                                Var: {featureStats[column].variance}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Correlation Matrix Visualization */}
              {correlationMatrix && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Feature Correlation Matrix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th className="p-2"></th>
                            {Object.keys(correlationMatrix).map((col) => (
                              <th key={col} className="p-2 text-center font-medium">
                                {col.slice(0, 8)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(correlationMatrix).map(([row, values]) => (
                            <tr key={row}>
                              <td className="p-2 font-medium">{row.slice(0, 8)}</td>
                              {Object.entries(values).map(([col, corr]) => (
                                <td key={col} className="p-2 text-center">
                                  <div
                                    className={`
                                      w-8 h-8 rounded flex items-center justify-center text-xs font-medium
                                      ${
                                        Math.abs(corr) > 0.8
                                          ? "bg-red-100 text-red-800"
                                          : Math.abs(corr) > 0.5
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                      }
                                    `}
                                  >
                                    {corr.toFixed(2)}
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="scaling" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Feature Scaling</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="scaleFeatures"
                        checked={processingOptions.scaleFeatures}
                        onCheckedChange={(checked) => handleOptionChange("scaleFeatures", checked)}
                      />
                      <Label htmlFor="scaleFeatures" className="font-medium">
                        Scale numeric features
                      </Label>
                    </div>

                    {processingOptions.scaleFeatures && (
                      <div>
                        <Label>Scaling Method</Label>
                        <Select
                          value={processingOptions.scalingMethod}
                          onValueChange={(value) => handleOptionChange("scalingMethod", value)}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minmax">Min-Max Scaling (0-1)</SelectItem>
                            <SelectItem value="standard">Standard Scaling (Z-score)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Categorical Encoding</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Encoding Method</Label>
                      <Select
                        value={processingOptions.encodeCategorical}
                        onValueChange={(value) => handleOptionChange("encodeCategorical", value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No encoding</SelectItem>
                          <SelectItem value="label">Label Encoding</SelectItem>
                          <SelectItem value="onehot">One-Hot Encoding</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Process Button */}
          <div className="mt-8 pt-6 border-t">
            <Button
              onClick={processData}
              disabled={processing}
              className="w-full h-12 text-lg bg-gradient-to-r from-green-600 to-green-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Play className="h-5 w-5 mr-2" />
              {processing ? "Processing Data..." : "Apply Preprocessing"}
            </Button>

            {processing && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing Progress</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="w-full h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Log */}
      {processingLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Processing Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-50 p-4 rounded-lg">
              {processingLog.map((log, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500 font-mono">{log.timestamp}</span>
                  {log.type === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {log.type === "error" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                  {log.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                  <span
                    className={
                      log.type === "success"
                        ? "text-green-700"
                        : log.type === "error"
                          ? "text-red-700"
                          : log.type === "warning"
                            ? "text-yellow-700"
                            : "text-gray-700"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {processedData && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Preprocessing Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">
                  {processedData.summary.totalRows.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Final Rows</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">{processedData.summary.columns}</div>
                <div className="text-sm text-gray-600">Total Features</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{processedData.summary.numericColumns.length}</div>
                <div className="text-sm text-gray-600">Numeric Features</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-orange-600">
                  {data.summary.totalRows - processedData.summary.totalRows}
                </div>
                <div className="text-sm text-gray-600">Rows Removed</div>
              </div>
            </div>

            {/* Applied Transformations */}
            <div className="space-y-3">
              <h4 className="font-medium text-green-900">Applied Transformations:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(processedData.summary.preprocessingApplied).map(([key, value]) => {
                  if (value && value !== "none" && value !== false) {
                    return (
                      <Badge key={key} variant="secondary" className="bg-green-100 text-green-800">
                        {key}: {typeof value === "boolean" ? "Applied" : value}
                      </Badge>
                    )
                  }
                  return null
                })}
              </div>
            </div>

            {/* Data Preview */}
            <div className="mt-6">
              <h4 className="font-medium text-green-900 mb-3">Processed Data Preview:</h4>
              <div className="max-h-64 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {processedData.headers.slice(0, 8).map((header, index) => (
                        <TableHead key={index} className="font-medium">
                          {header}
                        </TableHead>
                      ))}
                      {processedData.headers.length > 8 && <TableHead>...</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedData.rows.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        {processedData.headers.slice(0, 8).map((header, cellIndex) => (
                          <TableCell key={cellIndex} className="font-mono text-sm">
                            {typeof row[header] === "number" ? row[header].toFixed(4) : row[header]}
                          </TableCell>
                        ))}
                        {processedData.headers.length > 8 && <TableCell>...</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Showing first 5 rows and 8 columns of {processedData.rows.length.toLocaleString()} total rows and{" "}
                {processedData.headers.length} features
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
