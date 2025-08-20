"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  FileText,
  CheckCircle,
  Database,
  Globe,
  ShoppingCart,
  Users,
  Building,
  AlertTriangle,
  Shield,
  Clock,
} from "lucide-react"

export default function DataUpload({ onDataUploaded, systemConfig }) {
  const [file, setFile] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dataSource, setDataSource] = useState("file")
  const [validationResults, setValidationResults] = useState(null)

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]
      if (
        validTypes.includes(selectedFile.type) ||
        selectedFile.name.endsWith(".csv") ||
        selectedFile.name.endsWith(".xlsx")
      ) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError("Please select a valid CSV or Excel file")
      }
    }
  }

  const validateDataQuality = (processedData) => {
    const validation = {
      totalRows: processedData.rows.length,
      totalColumns: processedData.headers.length,
      missingValues: 0,
      duplicates: 0,
      dataTypes: {},
      dateColumns: [],
      numericColumns: [],
      categoricalColumns: [],
      qualityScore: 0,
      recommendations: [],
    }

    // Count missing values
    processedData.rows.forEach((row) => {
      processedData.headers.forEach((header) => {
        if (!row[header] || row[header] === "" || row[header] === "null") {
          validation.missingValues++
        }
      })
    })

    // Detect data types and columns
    processedData.headers.forEach((header) => {
      const sample = processedData.rows
        .slice(0, 100)
        .map((row) => row[header])
        .filter((val) => val && val !== "")

      if (sample.length === 0) return

      // Check if numeric
      const numericCount = sample.filter((val) => !isNaN(Number.parseFloat(val)) && isFinite(val)).length
      const numericRatio = numericCount / sample.length

      // Check if date
      const dateCount = sample.filter((val) => !isNaN(Date.parse(val))).length
      const dateRatio = dateCount / sample.length

      if (dateRatio > 0.8) {
        validation.dateColumns.push(header)
        validation.dataTypes[header] = "date"
      } else if (numericRatio > 0.8) {
        validation.numericColumns.push(header)
        validation.dataTypes[header] = "numeric"
      } else {
        validation.categoricalColumns.push(header)
        validation.dataTypes[header] = "categorical"
      }
    })

    // Find duplicates
    const seen = new Set()
    validation.duplicates = processedData.rows.filter((row) => {
      const rowString = JSON.stringify(row)
      if (seen.has(rowString)) {
        return true
      }
      seen.add(rowString)
      return false
    }).length

    // Calculate quality score
    const missingRatio = validation.missingValues / (validation.totalRows * validation.totalColumns)
    const duplicateRatio = validation.duplicates / validation.totalRows
    validation.qualityScore = Math.max(0, 100 - missingRatio * 50 - duplicateRatio * 30)

    // Generate recommendations
    if (missingRatio > 0.1) {
      validation.recommendations.push({
        type: "warning",
        message: `High missing data rate (${(missingRatio * 100).toFixed(1)}%). Consider data cleaning.`,
      })
    }

    if (duplicateRatio > 0.05) {
      validation.recommendations.push({
        type: "warning",
        message: `${validation.duplicates} duplicate records found. Remove duplicates for better accuracy.`,
      })
    }

    if (validation.dateColumns.length === 0) {
      validation.recommendations.push({
        type: "info",
        message: "No date columns detected. Time series forecasting may be limited.",
      })
    }

    if (validation.numericColumns.length < 2) {
      validation.recommendations.push({
        type: "warning",
        message: "Limited numeric columns. Consider adding more quantitative features.",
      })
    }

    return validation
  }

  const processCSV = useCallback(async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        throw new Error("File must contain at least a header row and one data row")
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

      const rows = lines
        .slice(1)
        .map((line, index) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
          const row = {}
          headers.forEach((header, headerIndex) => {
            row[header] = values[headerIndex] || ""
          })
          return row
        })
        .filter((row) => Object.values(row).some((val) => val !== "")) // Remove empty rows

      clearInterval(progressInterval)
      setUploadProgress(100)

      const processedData = {
        headers,
        rows,
        source: dataSource,
        uploadedAt: new Date().toISOString(),
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString(),
        },
        summary: {
          totalRows: rows.length,
          columns: headers.length,
          dateRange: getDateRange(rows, headers),
          numericColumns: getNumericColumns(headers, rows),
          categoricalColumns: getCategoricalColumns(headers, rows),
          missingValues: getMissingValues(headers, rows),
        },
      }

      // Validate data quality
      const validation = validateDataQuality(processedData)
      setValidationResults(validation)
      processedData.validation = validation

      setData(processedData)
      onDataUploaded(processedData)
    } catch (err) {
      setError(`Error processing file: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [file, onDataUploaded, dataSource])

  const getDateRange = (rows, headers) => {
    const dateColumns = ["date", "Date", "DATE", "timestamp", "time"]
    const dateColumn = dateColumns.find((col) => headers.includes(col))

    if (dateColumn) {
      const dates = rows.map((row) => new Date(row[dateColumn])).filter((d) => !isNaN(d.getTime()))
      if (dates.length > 0) {
        return {
          start: new Date(Math.min(...dates.map((d) => d.getTime()))).toLocaleDateString(),
          end: new Date(Math.max(...dates.map((d) => d.getTime()))).toLocaleDateString(),
          column: dateColumn,
        }
      }
    }
    return null
  }

  const getNumericColumns = (headers, rows) => {
    return headers.filter((header) => {
      const sample = rows.slice(0, 10).map((row) => row[header])
      return sample.every((val) => !isNaN(Number.parseFloat(val)) && isFinite(val))
    })
  }

  const getCategoricalColumns = (headers, rows) => {
    return headers.filter((header) => {
      const sample = rows.slice(0, 10).map((row) => row[header])
      return !sample.every((val) => !isNaN(Number.parseFloat(val)) && isFinite(val))
    })
  }

  const getMissingValues = (headers, rows) => {
    const missing = {}
    headers.forEach((header) => {
      const missingCount = rows.filter(
        (row) => !row[header] || row[header] === "" || row[header] === "null" || row[header] === "undefined",
      ).length
      if (missingCount > 0) {
        missing[header] = missingCount
      }
    })
    return missing
  }

  const simulateAPIConnection = async (source) => {
    setLoading(true)
    setError(null)

    // Simulate API connection delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setError(`${source.toUpperCase()} integration not yet implemented. Please use file upload for now.`)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* System Requirements Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Shield className="h-5 w-5" />
            Enterprise Data Import System
          </CardTitle>
          <CardDescription className="text-green-700">
            Secure, scalable data ingestion supporting multiple sources with automated validation
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Data Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Source Selection
          </CardTitle>
          <CardDescription>
            Choose your data source. Multiple integration options available for enterprise systems.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={dataSource} onValueChange={setDataSource}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Upload
              </TabsTrigger>
              <TabsTrigger value="erp" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                ERP System
              </TabsTrigger>
              <TabsTrigger value="pos" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                POS System
              </TabsTrigger>
              <TabsTrigger value="crm" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                CRM System
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                API/Database
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="csv-file">Upload Sales Data File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-600">
                  Supported formats: CSV, Excel (.xlsx, .xls). Maximum file size: 100MB
                </p>
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">{file.name}</span>
                  <span className="text-xs text-blue-600">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              )}

              <Button onClick={processCSV} disabled={!file || loading} className="w-full bg-green-700 text-white">
                {loading ? "Processing Data..." : "Process & Validate Data"}
              </Button>

              {loading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Upload Progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="erp" className="space-y-4 mt-6">
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">ERP System Integration</h3>
                <p className="text-gray-600 mb-4">Connect to SAP, Oracle, Microsoft Dynamics, or other ERP systems</p>
                <Button onClick={() => simulateAPIConnection("erp")} disabled={loading}>
                  {loading ? "Connecting..." : "Configure ERP Connection"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="pos" className="space-y-4 mt-6">
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">POS System Integration</h3>
                <p className="text-gray-600 mb-4">
                  Connect to Square, Shopify POS, Clover, or other point-of-sale systems
                </p>
                <Button onClick={() => simulateAPIConnection("pos")} disabled={loading}>
                  {loading ? "Connecting..." : "Configure POS Connection"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="crm" className="space-y-4 mt-6">
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">CRM System Integration</h3>
                <p className="text-gray-600 mb-4">Connect to Salesforce, HubSpot, Pipedrive, or other CRM systems</p>
                <Button onClick={() => simulateAPIConnection("crm")} disabled={loading}>
                  {loading ? "Connecting..." : "Configure CRM Connection"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4 mt-6">
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">API/Database Connection</h3>
                <p className="text-gray-600 mb-4">
                  Connect to REST APIs, PostgreSQL, MySQL, MongoDB, or other databases
                </p>
                <Button onClick={() => simulateAPIConnection("api")} disabled={loading}>
                  {loading ? "Connecting..." : "Configure API Connection"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Data Validation Results */}
      {validationResults && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Data Quality Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{validationResults.qualityScore.toFixed(0)}%</div>
                <div className="text-sm text-gray-600">Quality Score</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">{validationResults.totalRows.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{validationResults.numericColumns.length}</div>
                <div className="text-sm text-gray-600">Numeric Features</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-orange-600">{validationResults.dateColumns.length}</div>
                <div className="text-sm text-gray-600">Date Columns</div>
              </div>
            </div>

            {/* Data Quality Recommendations */}
            {validationResults.recommendations.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-green-900">Data Quality Recommendations:</h4>
                {validationResults.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      rec.type === "warning"
                        ? "bg-yellow-50 border-yellow-400 text-yellow-800"
                        : "bg-blue-50 border-blue-400 text-blue-800"
                    }`}
                  >
                    {rec.message}
                  </div>
                ))}
              </div>
            )}

            {/* Column Analysis */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-green-900 mb-2">
                  Numeric Columns ({validationResults.numericColumns.length})
                </h4>
                <div className="space-y-1">
                  {validationResults.numericColumns.slice(0, 5).map((col) => (
                    <Badge key={col} variant="secondary" className="mr-1 mb-1">
                      {col}
                    </Badge>
                  ))}
                  {validationResults.numericColumns.length > 5 && (
                    <span className="text-sm text-gray-600">+{validationResults.numericColumns.length - 5} more</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-green-900 mb-2">
                  Date Columns ({validationResults.dateColumns.length})
                </h4>
                <div className="space-y-1">
                  {validationResults.dateColumns.map((col) => (
                    <Badge key={col} variant="outline" className="mr-1 mb-1">
                      {col}
                    </Badge>
                  ))}
                  {validationResults.dateColumns.length === 0 && (
                    <span className="text-sm text-gray-500">No date columns detected</span>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-green-900 mb-2">
                  Categorical Columns ({validationResults.categoricalColumns.length})
                </h4>
                <div className="space-y-1">
                  {validationResults.categoricalColumns.slice(0, 5).map((col) => (
                    <Badge key={col} variant="outline" className="mr-1 mb-1">
                      {col}
                    </Badge>
                  ))}
                  {validationResults.categoricalColumns.length > 5 && (
                    <span className="text-sm text-gray-600">
                      +{validationResults.categoricalColumns.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Data Successfully Imported
            </CardTitle>
            <CardDescription>
              {data.summary.totalRows.toLocaleString()} records imported from{" "}
              {data.source === "file" ? data.fileInfo.name : data.source}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{data.summary.totalRows.toLocaleString()}</div>
                <div className="text-sm text-blue-800">Total Records</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{data.summary.columns}</div>
                <div className="text-sm text-green-800">Columns</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{data.summary.numericColumns.length}</div>
                <div className="text-sm text-purple-800">Numeric Features</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.keys(data.summary.missingValues || {}).length}
                </div>
                <div className="text-sm text-orange-800">Columns with Missing Data</div>
              </div>
            </div>

            {data.summary.dateRange && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <strong>Date Range:</strong> {data.summary.dateRange.start} to {data.summary.dateRange.end}
                <span className="text-sm text-gray-600 ml-2">({data.summary.dateRange.column})</span>
              </div>
            )}

            <div className="max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {data.headers.slice(0, 8).map((header, index) => (
                      <TableHead key={index}>{header}</TableHead>
                    ))}
                    {data.headers.length > 8 && <TableHead>...</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      {data.headers.slice(0, 8).map((header, cellIndex) => (
                        <TableCell key={cellIndex}>{row[header]}</TableCell>
                      ))}
                      {data.headers.length > 8 && <TableCell>...</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Showing first 5 rows and 8 columns of {data.rows.length.toLocaleString()} total records
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
