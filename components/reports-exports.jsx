"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Download,
  Mail,
  Calendar,
  BarChart3,
  TrendingUp,
  Target,
  FileImage,
  FileSpreadsheet,
  CheckCircle,
} from "lucide-react"

export default function ReportsExports({ data, models, systemConfig }) {
  const [reportType, setReportType] = useState("comprehensive")
  const [exportFormat, setExportFormat] = useState("pdf")
  const [selectedSections, setSelectedSections] = useState({
    executiveSummary: true,
    dataOverview: true,
    modelPerformance: true,
    forecasts: true,
    recommendations: true,
    technicalDetails: false,
  })
  const [scheduledReports, setScheduledReports] = useState([])
  const [customReport, setCustomReport] = useState({
    title: "",
    description: "",
    sections: [],
    recipients: "",
  })
  const [generating, setGenerating] = useState(false)

  const reportTemplates = [
    {
      id: "executive",
      name: "Executive Summary",
      description: "High-level insights for leadership",
      sections: ["executiveSummary", "keyMetrics", "recommendations"],
      icon: Target,
    },
    {
      id: "comprehensive",
      name: "Comprehensive Analysis",
      description: "Complete forecasting report with all details",
      sections: ["executiveSummary", "dataOverview", "modelPerformance", "forecasts", "recommendations"],
      icon: FileText,
    },
    {
      id: "technical",
      name: "Technical Report",
      description: "Detailed technical analysis for data scientists",
      sections: ["dataOverview", "modelPerformance", "technicalDetails", "forecasts"],
      icon: BarChart3,
    },
    {
      id: "forecast-only",
      name: "Forecast Report",
      description: "Focus on predictions and trends",
      sections: ["forecasts", "recommendations"],
      icon: TrendingUp,
    },
  ]

  const exportFormats = [
    { id: "pdf", name: "PDF Report", icon: FileText, description: "Professional formatted report" },
    { id: "excel", name: "Excel Workbook", icon: FileSpreadsheet, description: "Interactive spreadsheet with data" },
    { id: "powerpoint", name: "PowerPoint", icon: FileImage, description: "Presentation slides" },
    { id: "json", name: "JSON Data", icon: FileText, description: "Raw data export" },
    { id: "csv", name: "CSV Data", icon: FileSpreadsheet, description: "Comma-separated values" },
  ]

  const generateReport = async () => {
    if (!data || !models) {
      return
    }

    setGenerating(true)

    try {
      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const reportData = {
        metadata: {
          title: `Sales Forecasting Report - ${reportType}`,
          generatedAt: new Date().toISOString(),
          format: exportFormat,
          sections: selectedSections,
          dataSource: data.source || "uploaded",
          recordCount: data.summary?.totalRows || 0,
        },
        executiveSummary: {
          keyFindings: [
            `Analyzed ${data.summary?.totalRows?.toLocaleString() || 0} sales records`,
            `Best performing model: ${getBestModel()?.name || "N/A"}`,
            `Forecast accuracy: ${getBestModel()?.accuracy ? (Number.parseFloat(getBestModel().accuracy) * 100).toFixed(1) : "N/A"}%`,
            `Identified ${getOpportunityCount()} growth opportunities`,
          ],
          recommendations: [
            "Focus on improving consistency in underperforming periods",
            "Leverage seasonal patterns for inventory planning",
            "Implement automated alerts for significant deviations",
          ],
        },
        dataOverview: {
          totalRecords: data.summary?.totalRows || 0,
          dateRange: data.summary?.dateRange,
          numericFeatures: data.summary?.numericColumns?.length || 0,
          missingData: Object.keys(data.summary?.missingValues || {}).length,
          qualityScore: data.validation?.qualityScore || "N/A",
        },
        modelPerformance: models
          ? Object.entries(models.models).map(([id, model]) => ({
              name: model.name,
              accuracy: (Number.parseFloat(model.accuracy) * 100).toFixed(1) + "%",
              mse: model.mse,
              trainingTime: model.trainingTime + "s",
            }))
          : [],
        forecasts: generateSampleForecasts(),
      }

      // Create and download the report
      downloadReport(reportData)
    } catch (error) {
      console.error("Error generating report:", error)
    } finally {
      setGenerating(false)
    }
  }

  const getBestModel = () => {
    if (!models || !models.models) return null
    return Object.values(models.models).reduce((best, current) =>
      Number.parseFloat(current.accuracy) > Number.parseFloat(best.accuracy) ? current : best,
    )
  }

  const getOpportunityCount = () => {
    // Simulate opportunity detection
    return Math.floor(Math.random() * 5) + 3
  }

  const generateSampleForecasts = () => {
    const forecasts = []
    const horizons = systemConfig.forecastHorizons || ["daily", "weekly", "monthly"]

    horizons.forEach((horizon) => {
      forecasts.push({
        horizon,
        periods: horizon === "daily" ? 30 : horizon === "weekly" ? 12 : 6,
        avgPrediction: (Math.random() * 1000 + 500).toFixed(2),
        trend: Math.random() > 0.5 ? "increasing" : "decreasing",
        confidence: (Math.random() * 20 + 80).toFixed(1) + "%",
      })
    })

    return forecasts
  }

  const downloadReport = (reportData) => {
    const filename = `sales-forecast-report-${reportType}-${new Date().toISOString().split("T")[0]}.${exportFormat}`

    if (exportFormat === "json") {
      const dataStr = JSON.stringify(reportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename
      link.click()
    } else {
      // For other formats, we would typically generate the actual file
      // For demo purposes, we'll create a text summary
      const summary = generateTextSummary(reportData)
      const dataBlob = new Blob([summary], { type: "text/plain" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = filename.replace(`.${exportFormat}`, ".txt")
      link.click()
    }
  }

  const generateTextSummary = (reportData) => {
    return `
SALES FORECASTING REPORT
========================

Generated: ${new Date(reportData.metadata.generatedAt).toLocaleString()}
Report Type: ${reportData.metadata.title}
Format: ${reportData.metadata.format.toUpperCase()}

EXECUTIVE SUMMARY
-----------------
${reportData.executiveSummary.keyFindings.map((finding) => `• ${finding}`).join("\n")}

RECOMMENDATIONS
---------------
${reportData.executiveSummary.recommendations.map((rec) => `• ${rec}`).join("\n")}

DATA OVERVIEW
-------------
• Total Records: ${reportData.dataOverview.totalRecords.toLocaleString()}
• Numeric Features: ${reportData.dataOverview.numericFeatures}
• Data Quality Score: ${reportData.dataOverview.qualityScore}%
${reportData.dataOverview.dateRange ? `• Date Range: ${reportData.dataOverview.dateRange.start} to ${reportData.dataOverview.dateRange.end}` : ""}

MODEL PERFORMANCE
-----------------
${reportData.modelPerformance
  .map((model) => `• ${model.name}: ${model.accuracy} accuracy (${model.trainingTime} training time)`)
  .join("\n")}

FORECASTS
---------
${reportData.forecasts
  .map(
    (forecast) =>
      `• ${forecast.horizon.toUpperCase()}: ${forecast.periods} periods, avg ${forecast.avgPrediction}, ${forecast.trend} trend (${forecast.confidence} confidence)`,
  )
  .join("\n")}

---
Generated by Predictive Sales Forecasting System
    `
  }

  const scheduleReport = () => {
    const newSchedule = {
      id: Date.now(),
      type: reportType,
      format: exportFormat,
      frequency: "weekly", // This would be configurable
      nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      recipients: customReport.recipients
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email),
      sections: { ...selectedSections },
    }

    setScheduledReports((prev) => [...prev, newSchedule])
  }

  const handleSectionToggle = (section) => {
    setSelectedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (!data) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>Please upload and process data first to generate reports.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <FileText className="h-6 w-6" />
            Reports & Export Center
          </CardTitle>
          <CardDescription className="text-blue-700">
            Generate professional reports and export forecasting results in multiple formats
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
          <TabsTrigger value="schedule">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Report Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Report Template</CardTitle>
                <CardDescription>Choose a pre-configured report template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      reportType === template.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setReportType(template.id)}
                  >
                    <div className="flex items-start gap-3">
                      <template.icon className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.sections.map((section) => (
                            <Badge key={section} variant="outline" className="text-xs">
                              {section.replace(/([A-Z])/g, " $1").toLowerCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Export Format Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Export Format</CardTitle>
                <CardDescription>Select the output format for your report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {exportFormats.map((format) => (
                  <div
                    key={format.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      exportFormat === format.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setExportFormat(format.id)}
                  >
                    <div className="flex items-center gap-3">
                      <format.icon className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{format.name}</h4>
                        <p className="text-sm text-gray-600">{format.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Section Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Report Sections</CardTitle>
              <CardDescription>Customize which sections to include in your report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(selectedSections).map(([section, selected]) => (
                  <div key={section} className="flex items-center space-x-2">
                    <Checkbox id={section} checked={selected} onCheckedChange={() => handleSectionToggle(section)} />
                    <Label htmlFor={section} className="font-medium">
                      {section.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generate Report */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Ready to Generate Report</h3>
                  <p className="text-sm text-gray-600">
                    {reportType.replace("-", " ").toUpperCase()} report in {exportFormat.toUpperCase()} format
                  </p>
                </div>
                <Button onClick={generateReport} disabled={generating} size="lg">
                  <Download className="h-4 w-4 mr-2" />
                  {generating ? "Generating..." : "Generate & Download"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Scheduled Reports
              </CardTitle>
              <CardDescription>Automate report generation and delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Email Recipients</Label>
                  <Input
                    placeholder="email1@company.com, email2@company.com"
                    value={customReport.recipients}
                    onChange={(e) => setCustomReport((prev) => ({ ...prev, recipients: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Frequency</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={scheduleReport} className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Report
                  </Button>
                </div>
              </div>

              {/* Scheduled Reports List */}
              {scheduledReports.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h4 className="font-medium">Active Schedules</h4>
                  {scheduledReports.map((schedule) => (
                    <div key={schedule.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{schedule.type.replace("-", " ").toUpperCase()} Report</h5>
                          <p className="text-sm text-gray-600">
                            {schedule.format.toUpperCase()} • {schedule.frequency} • Next: {schedule.nextRun}
                          </p>
                          <p className="text-sm text-gray-600">Recipients: {schedule.recipients.join(", ")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Active</Badge>
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>Create a custom report with specific sections and formatting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Report Title</Label>
                  <Input
                    placeholder="Enter custom report title"
                    value={customReport.title}
                    onChange={(e) => setCustomReport((prev) => ({ ...prev, title: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Report Description</Label>
                  <Input
                    placeholder="Brief description of the report"
                    value={customReport.description}
                    onChange={(e) => setCustomReport((prev) => ({ ...prev, description: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Custom Content</Label>
                <Textarea
                  placeholder="Add any custom analysis, notes, or specific requirements..."
                  className="mt-2 min-h-[100px]"
                />
              </div>

              <div className="flex justify-end">
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Save Custom Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report Preview */}
      {models && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Report Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <div className="border-b pb-2">
                <h3 className="text-lg font-bold">Sales Forecasting Report - {reportType.toUpperCase()}</h3>
                <p className="text-sm text-gray-600">Generated: {new Date().toLocaleDateString()}</p>
              </div>

              {selectedSections.executiveSummary && (
                <div>
                  <h4 className="font-medium text-blue-900">Executive Summary</h4>
                  <ul className="text-sm text-gray-700 mt-1 space-y-1">
                    <li>• Analyzed {data.summary?.totalRows?.toLocaleString() || 0} sales records</li>
                    <li>
                      • Best model accuracy:{" "}
                      {getBestModel() ? (Number.parseFloat(getBestModel().accuracy) * 100).toFixed(1) : "N/A"}%
                    </li>
                    <li>• {getOpportunityCount()} growth opportunities identified</li>
                  </ul>
                </div>
              )}

              {selectedSections.modelPerformance && models && (
                <div>
                  <h4 className="font-medium text-blue-900">Model Performance</h4>
                  <div className="text-sm text-gray-700 mt-1">
                    {Object.entries(models.models)
                      .slice(0, 2)
                      .map(([id, model]) => (
                        <div key={id}>
                          • {model.name}: {(Number.parseFloat(model.accuracy) * 100).toFixed(1)}% accuracy
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {selectedSections.recommendations && (
                <div>
                  <h4 className="font-medium text-blue-900">Key Recommendations</h4>
                  <ul className="text-sm text-gray-700 mt-1 space-y-1">
                    <li>• Focus on consistency improvements in underperforming periods</li>
                    <li>• Implement automated monitoring for forecast deviations</li>
                    <li>• Leverage seasonal patterns for strategic planning</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
