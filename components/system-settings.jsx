"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  Shield,
  Zap,
  Globe,
  Users,
  Target,
  CheckCircle,
  AlertTriangle,
  Save,
  RefreshCw,
  Download,
  Upload,
} from "lucide-react"

export default function SystemSettings({ config, onConfigUpdate }) {
  const [settings, setSettings] = useState({
    performance: {
      maxDatasetSize: 1000000,
      processingTimeout: 120,
      dashboardRefreshRate: 3,
      cacheEnabled: true,
      parallelProcessing: true,
    },
    security: {
      encryptionEnabled: true,
      httpsOnly: true,
      sessionTimeout: 30,
      auditLogging: true,
      accessControl: true,
    },
    forecasting: {
      targetAccuracy: config?.targetAccuracy || 85,
      forecastHorizons: config?.forecastHorizons || ["daily", "weekly", "monthly", "yearly"],
      autoRetraining: true,
      retrainingFrequency: "weekly",
      confidenceInterval: 95,
    },
    integrations: {
      erp: config?.integrations?.erp || false,
      pos: config?.integrations?.pos || false,
      crm: config?.integrations?.crm || false,
      apiRateLimit: 1000,
      webhookEnabled: false,
    },
    alerts: {
      significantDeviation: config?.alertThresholds?.significantDeviation || 15,
      lowAccuracy: config?.alertThresholds?.lowAccuracy || 80,
      emailEnabled: true,
      smsEnabled: false,
    },
    ui: {
      theme: "light",
      language: "en",
      timezone: "UTC",
      dateFormat: "MM/DD/YYYY",
      numberFormat: "US",
    },
  })

  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  const updateSetting = (category, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
  }

  const saveSettings = async () => {
    setSaving(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update parent config
      onConfigUpdate((prev) => ({
        ...prev,
        targetAccuracy: settings.forecasting.targetAccuracy,
        forecastHorizons: settings.forecasting.forecastHorizons,
        alertThresholds: {
          significantDeviation: settings.alerts.significantDeviation,
          lowAccuracy: settings.alerts.lowAccuracy,
        },
        integrations: {
          erp: settings.integrations.erp,
          pos: settings.integrations.pos,
          crm: settings.integrations.crm,
        },
      }))

      setLastSaved(new Date())
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = () => {
    setSettings({
      performance: {
        maxDatasetSize: 1000000,
        processingTimeout: 120,
        dashboardRefreshRate: 3,
        cacheEnabled: true,
        parallelProcessing: true,
      },
      security: {
        encryptionEnabled: true,
        httpsOnly: true,
        sessionTimeout: 30,
        auditLogging: true,
        accessControl: true,
      },
      forecasting: {
        targetAccuracy: 85,
        forecastHorizons: ["daily", "weekly", "monthly", "yearly"],
        autoRetraining: true,
        retrainingFrequency: "weekly",
        confidenceInterval: 95,
      },
      integrations: {
        erp: false,
        pos: false,
        crm: false,
        apiRateLimit: 1000,
        webhookEnabled: false,
      },
      alerts: {
        significantDeviation: 15,
        lowAccuracy: 80,
        emailEnabled: true,
        smsEnabled: false,
      },
      ui: {
        theme: "light",
        language: "en",
        timezone: "UTC",
        dateFormat: "MM/DD/YYYY",
        numberFormat: "US",
      },
    })
  }

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `system-settings-${new Date().toISOString().split("T")[0]}.json`
    link.click()
  }

  const importSettings = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result)
          setSettings(importedSettings)
        } catch (error) {
          console.error("Error importing settings:", error)
        }
      }
      reader.readAsText(file)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Settings className="h-6 w-6" />
                System Configuration
              </CardTitle>
              <CardDescription className="text-gray-700">
                Configure system performance, security, and operational parameters
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {lastSaved && <div className="text-sm text-gray-600">Last saved: {lastSaved.toLocaleTimeString()}</div>}
              <Button onClick={saveSettings} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="ui">Interface</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Settings
              </CardTitle>
              <CardDescription>Configure system performance and processing limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Maximum Dataset Size (rows)</Label>
                  <Input
                    type="number"
                    value={settings.performance.maxDatasetSize}
                    onChange={(e) => updateSetting("performance", "maxDatasetSize", Number.parseInt(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Maximum number of rows that can be processed</p>
                </div>

                <div>
                  <Label>Processing Timeout (seconds)</Label>
                  <Input
                    type="number"
                    value={settings.performance.processingTimeout}
                    onChange={(e) => updateSetting("performance", "processingTimeout", Number.parseInt(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Maximum time allowed for data processing operations</p>
                </div>

                <div>
                  <Label>Dashboard Refresh Rate (seconds)</Label>
                  <Input
                    type="number"
                    value={settings.performance.dashboardRefreshRate}
                    onChange={(e) =>
                      updateSetting("performance", "dashboardRefreshRate", Number.parseInt(e.target.value))
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">How often dashboards should refresh automatically</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Caching</Label>
                    <p className="text-sm text-gray-600">Cache results to improve performance</p>
                  </div>
                  <Switch
                    checked={settings.performance.cacheEnabled}
                    onCheckedChange={(checked) => updateSetting("performance", "cacheEnabled", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Parallel Processing</Label>
                    <p className="text-sm text-gray-600">Use multiple CPU cores for faster processing</p>
                  </div>
                  <Switch
                    checked={settings.performance.parallelProcessing}
                    onCheckedChange={(checked) => updateSetting("performance", "parallelProcessing", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Database: Connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">ML Engine: Running</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Cache: Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security and access control settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>AES-256 Encryption</Label>
                    <p className="text-sm text-gray-600">Encrypt all stored and transmitted data</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.security.encryptionEnabled}
                      onCheckedChange={(checked) => updateSetting("security", "encryptionEnabled", checked)}
                      disabled={true} // Always enabled for security
                    />
                    <Badge variant="secondary">Required</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>HTTPS Only</Label>
                    <p className="text-sm text-gray-600">Force all connections to use HTTPS</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.security.httpsOnly}
                      onCheckedChange={(checked) => updateSetting("security", "httpsOnly", checked)}
                      disabled={true} // Always enabled for security
                    />
                    <Badge variant="secondary">Required</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-gray-600">Log all user actions and system events</p>
                  </div>
                  <Switch
                    checked={settings.security.auditLogging}
                    onCheckedChange={(checked) => updateSetting("security", "auditLogging", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Access Control</Label>
                    <p className="text-sm text-gray-600">Enable role-based access control</p>
                  </div>
                  <Switch
                    checked={settings.security.accessControl}
                    onCheckedChange={(checked) => updateSetting("security", "accessControl", checked)}
                  />
                </div>
              </div>

              <div>
                <Label>Session Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => updateSetting("security", "sessionTimeout", Number.parseInt(e.target.value))}
                  className="mt-2"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Automatically log out users after this period of inactivity
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Forecasting Configuration
              </CardTitle>
              <CardDescription>Configure forecasting algorithms and accuracy targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Target Accuracy (%)</Label>
                  <Input
                    type="number"
                    min="70"
                    max="99"
                    value={settings.forecasting.targetAccuracy}
                    onChange={(e) => updateSetting("forecasting", "targetAccuracy", Number.parseInt(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Minimum acceptable forecast accuracy (requirement: ≥85%)</p>
                </div>

                <div>
                  <Label>Confidence Interval (%)</Label>
                  <Select
                    value={settings.forecasting.confidenceInterval.toString()}
                    onValueChange={(value) =>
                      updateSetting("forecasting", "confidenceInterval", Number.parseInt(value))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="90">90%</SelectItem>
                      <SelectItem value="95">95%</SelectItem>
                      <SelectItem value="99">99%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Forecast Horizons</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                  {["daily", "weekly", "monthly", "quarterly", "yearly"].map((horizon) => (
                    <div key={horizon} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={horizon}
                        checked={settings.forecasting.forecastHorizons.includes(horizon)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateSetting("forecasting", "forecastHorizons", [
                              ...settings.forecasting.forecastHorizons,
                              horizon,
                            ])
                          } else {
                            updateSetting(
                              "forecasting",
                              "forecastHorizons",
                              settings.forecasting.forecastHorizons.filter((h) => h !== horizon),
                            )
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={horizon} className="text-sm capitalize">
                        {horizon}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Retraining</Label>
                    <p className="text-sm text-gray-600">Automatically retrain models with new data</p>
                  </div>
                  <Switch
                    checked={settings.forecasting.autoRetraining}
                    onCheckedChange={(checked) => updateSetting("forecasting", "autoRetraining", checked)}
                  />
                </div>

                {settings.forecasting.autoRetraining && (
                  <div>
                    <Label>Retraining Frequency</Label>
                    <Select
                      value={settings.forecasting.retrainingFrequency}
                      onValueChange={(value) => updateSetting("forecasting", "retrainingFrequency", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                System Integrations
              </CardTitle>
              <CardDescription>Configure connections to external systems and APIs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>ERP System Integration</Label>
                    <p className="text-sm text-gray-600">Connect to SAP, Oracle, or other ERP systems</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.integrations.erp}
                      onCheckedChange={(checked) => updateSetting("integrations", "erp", checked)}
                    />
                    {settings.integrations.erp && <Badge variant="default">Active</Badge>}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>POS System Integration</Label>
                    <p className="text-sm text-gray-600">Connect to point-of-sale systems</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.integrations.pos}
                      onCheckedChange={(checked) => updateSetting("integrations", "pos", checked)}
                    />
                    {settings.integrations.pos && <Badge variant="default">Active</Badge>}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>CRM System Integration</Label>
                    <p className="text-sm text-gray-600">Connect to customer relationship management systems</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.integrations.crm}
                      onCheckedChange={(checked) => updateSetting("integrations", "crm", checked)}
                    />
                    {settings.integrations.crm && <Badge variant="default">Active</Badge>}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Webhook Notifications</Label>
                    <p className="text-sm text-gray-600">Send HTTP callbacks for events</p>
                  </div>
                  <Switch
                    checked={settings.integrations.webhookEnabled}
                    onCheckedChange={(checked) => updateSetting("integrations", "webhookEnabled", checked)}
                  />
                </div>
              </div>

              <div>
                <Label>API Rate Limit (requests/hour)</Label>
                <Input
                  type="number"
                  value={settings.integrations.apiRateLimit}
                  onChange={(e) => updateSetting("integrations", "apiRateLimit", Number.parseInt(e.target.value))}
                  className="mt-2"
                />
                <p className="text-xs text-gray-600 mt-1">Maximum API requests allowed per hour</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alert Configuration
              </CardTitle>
              <CardDescription>Configure alert thresholds and notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Significant Deviation Threshold (%)</Label>
                  <Input
                    type="number"
                    value={settings.alerts.significantDeviation}
                    onChange={(e) => updateSetting("alerts", "significantDeviation", Number.parseFloat(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Alert when forecasts deviate by this percentage</p>
                </div>

                <div>
                  <Label>Low Accuracy Threshold (%)</Label>
                  <Input
                    type="number"
                    value={settings.alerts.lowAccuracy}
                    onChange={(e) => updateSetting("alerts", "lowAccuracy", Number.parseFloat(e.target.value))}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Alert when model accuracy drops below this level</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Alerts</Label>
                    <p className="text-sm text-gray-600">Send alerts via email</p>
                  </div>
                  <Switch
                    checked={settings.alerts.emailEnabled}
                    onCheckedChange={(checked) => updateSetting("alerts", "emailEnabled", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Alerts</Label>
                    <p className="text-sm text-gray-600">Send critical alerts via SMS</p>
                  </div>
                  <Switch
                    checked={settings.alerts.smsEnabled}
                    onCheckedChange={(checked) => updateSetting("alerts", "smsEnabled", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ui" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Interface Settings
              </CardTitle>
              <CardDescription>Customize the user interface and localization settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Theme</Label>
                  <Select value={settings.ui.theme} onValueChange={(value) => updateSetting("ui", "theme", value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Language</Label>
                  <Select
                    value={settings.ui.language}
                    onValueChange={(value) => updateSetting("ui", "language", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Timezone</Label>
                  <Select
                    value={settings.ui.timezone}
                    onValueChange={(value) => updateSetting("ui", "timezone", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Date Format</Label>
                  <Select
                    value={settings.ui.dateFormat}
                    onValueChange={(value) => updateSetting("ui", "dateFormat", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Management */}
      <Card>
        <CardHeader>
          <CardTitle>Settings Management</CardTitle>
          <CardDescription>Import, export, or reset system settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={exportSettings} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Settings
            </Button>

            <div>
              <input type="file" accept=".json" onChange={importSettings} className="hidden" id="import-settings" />
              <Button asChild variant="outline">
                <label htmlFor="import-settings" className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Settings
                </label>
              </Button>
            </div>

            <Button onClick={resetToDefaults} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
