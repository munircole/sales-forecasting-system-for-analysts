"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Database,
  HardDrive,
  Cloud,
  Shield,
  Download,
  Trash2,
  Archive,
  Search,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  BarChart3,
} from "lucide-react"

export default function DataStorage({ user }) {
  const [storageData, setStorageData] = useState({
    used: 2.4, // GB
    total: 10.0, // GB
    datasets: [],
    models: [],
    reports: [],
    backups: [],
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStorageData()
  }, [])

  const loadStorageData = async () => {
    setLoading(true)

    try {
      // Simulate loading storage data
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockData = {
        used: 2.4,
        total: user.role === "admin" ? 50.0 : 10.0,
        datasets: [
          {
            id: "ds-001",
            name: "Q4_2024_Sales_Data.csv",
            type: "dataset",
            size: 0.8,
            created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            lastAccessed: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            records: 125000,
            status: "active",
            encrypted: true,
          },
          {
            id: "ds-002",
            name: "Historical_Sales_2020-2024.xlsx",
            type: "dataset",
            size: 1.2,
            created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            lastAccessed: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            records: 450000,
            status: "active",
            encrypted: true,
          },
        ],
        models: [
          {
            id: "ml-001",
            name: "LSTM_Sales_Forecast_v2.3",
            type: "model",
            size: 0.15,
            created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            lastAccessed: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            accuracy: 87.3,
            status: "deployed",
            encrypted: true,
          },
          {
            id: "ml-002",
            name: "Decision_Tree_Model_v1.8",
            type: "model",
            size: 0.05,
            created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            accuracy: 82.1,
            status: "archived",
            encrypted: true,
          },
        ],
        reports: [
          {
            id: "rp-001",
            name: "Monthly_Forecast_Report_Dec2024.pdf",
            type: "report",
            size: 0.03,
            created: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            lastAccessed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            format: "PDF",
            status: "generated",
            encrypted: true,
          },
        ],
        backups: [
          {
            id: "bk-001",
            name: "System_Backup_2024-12-15",
            type: "backup",
            size: 0.25,
            created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            lastAccessed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: "completed",
            encrypted: true,
          },
        ],
      }

      setStorageData(mockData)
    } catch (error) {
      console.error("Error loading storage data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getAllItems = () => {
    return [...storageData.datasets, ...storageData.models, ...storageData.reports, ...storageData.backups]
  }

  const getFilteredItems = () => {
    let items = getAllItems()

    if (filterType !== "all") {
      items = items.filter((item) => item.type === filterType)
    }

    if (searchTerm) {
      items = items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    return items.sort((a, b) => new Date(b.created) - new Date(a.created))
  }

  const formatFileSize = (sizeInGB) => {
    if (sizeInGB < 0.001) {
      return `${(sizeInGB * 1000000).toFixed(0)} KB`
    } else if (sizeInGB < 1) {
      return `${(sizeInGB * 1000).toFixed(0)} MB`
    } else {
      return `${sizeInGB.toFixed(2)} GB`
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      return "Just now"
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getStatusBadge = (status, type) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      deployed: { color: "bg-blue-100 text-blue-800", label: "Deployed" },
      archived: { color: "bg-gray-100 text-gray-800", label: "Archived" },
      generated: { color: "bg-purple-100 text-purple-800", label: "Generated" },
      completed: { color: "bg-green-100 text-green-800", label: "Completed" },
    }

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status }

    return (
      <Badge className={config.color} variant="secondary">
        {config.label}
      </Badge>
    )
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case "dataset":
        return <Database className="h-4 w-4" />
      case "model":
        return <BarChart3 className="h-4 w-4" />
      case "report":
        return <FileText className="h-4 w-4" />
      case "backup":
        return <Archive className="h-4 w-4" />
      default:
        return <HardDrive className="h-4 w-4" />
    }
  }

  const deleteItem = async (itemId) => {
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Remove item from storage data
      setStorageData((prev) => ({
        ...prev,
        datasets: prev.datasets.filter((item) => item.id !== itemId),
        models: prev.models.filter((item) => item.id !== itemId),
        reports: prev.reports.filter((item) => item.id !== itemId),
        backups: prev.backups.filter((item) => item.id !== itemId),
      }))
    } catch (error) {
      console.error("Error deleting item:", error)
    } finally {
      setLoading(false)
    }
  }

  const downloadItem = async (item) => {
    // Simulate download
    const link = document.createElement("a")
    link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(`Mock data for ${item.name}`)}`
    link.download = item.name
    link.click()
  }

  const usagePercentage = (storageData.used / storageData.total) * 100

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Storage Used</p>
                <p className="text-2xl font-bold text-blue-900">{formatFileSize(storageData.used)}</p>
                <p className="text-xs text-blue-700">of {formatFileSize(storageData.total)}</p>
              </div>
              <HardDrive className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Datasets</p>
                <p className="text-2xl font-bold text-green-900">{storageData.datasets.length}</p>
                <p className="text-xs text-green-700">Active files</p>
              </div>
              <Database className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">ML Models</p>
                <p className="text-2xl font-bold text-purple-900">{storageData.models.length}</p>
                <p className="text-xs text-purple-700">Trained models</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Reports</p>
                <p className="text-2xl font-bold text-orange-900">{storageData.reports.length}</p>
                <p className="text-xs text-orange-700">Generated reports</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Storage Usage
          </CardTitle>
          <CardDescription>Monitor your data storage consumption and limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Used: {formatFileSize(storageData.used)}</span>
                <span>Available: {formatFileSize(storageData.total - storageData.used)}</span>
              </div>
              <Progress value={usagePercentage} className="w-full h-2" />
              <p className="text-xs text-gray-600 mt-1">{usagePercentage.toFixed(1)}% of total storage used</p>
            </div>

            {usagePercentage > 80 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Storage is running low. Consider archiving old data or upgrading your plan.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>All data encrypted with AES-256</span>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Automatic backups enabled</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Manage your datasets, models, reports, and backups</CardDescription>
            </div>
            <Button onClick={loadStorageData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="dataset">Datasets</option>
                <option value="model">ML Models</option>
                <option value="report">Reports</option>
                <option value="backup">Backups</option>
              </select>
            </div>
          </div>

          {/* File List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">Loading storage data...</p>
              </div>
            ) : getFilteredItems().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            ) : (
              getFilteredItems().map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                      {getTypeIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium truncate">{item.name}</h4>
                        {getStatusBadge(item.status, item.type)}
                        {item.encrypted && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <Shield className="h-3 w-3 mr-1" />
                            Encrypted
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{formatFileSize(item.size)}</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Modified {formatDate(item.created)}</span>
                        </span>
                        {item.records && <span>{item.records.toLocaleString()} records</span>}
                        {item.accuracy && <span>{item.accuracy}% accuracy</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => downloadItem(item)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    {user.permissions?.includes("write") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storage Settings */}
      {user.permissions?.includes("admin") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Storage Settings
            </CardTitle>
            <CardDescription>Configure storage policies and retention settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Auto-Archive Policy</Label>
                <p className="text-sm text-gray-600 mb-2">Automatically archive files older than specified period</p>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                  <option value="never">Never</option>
                </select>
              </div>

              <div>
                <Label className="text-base font-medium">Backup Frequency</Label>
                <p className="text-sm text-gray-600 mb-2">How often to create automatic backups</p>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <Label className="text-base font-medium">Retention Period</Label>
                <p className="text-sm text-gray-600 mb-2">How long to keep backup files</p>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>

              <Button className="w-full">Save Storage Settings</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
