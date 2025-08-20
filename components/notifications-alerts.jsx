"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Mail, Smartphone, AlertTriangle, CheckCircle, Target, Clock, Zap } from "lucide-react"

export default function NotificationsAlerts({ models, systemConfig, onConfigUpdate }) {
  const [alertSettings, setAlertSettings] = useState({
    email: {
      enabled: true,
      address: "",
      frequency: "immediate",
    },
    sms: {
      enabled: false,
      number: "",
      frequency: "critical",
    },
    inApp: {
      enabled: true,
      frequency: "all",
    },
    thresholds: {
      significantDeviation: systemConfig?.alertThresholds?.significantDeviation || 15,
      lowAccuracy: systemConfig?.alertThresholds?.lowAccuracy || 80,
      highVolatility: 25,
      dataQuality: 70,
    },
    triggers: {
      forecastDeviation: true,
      modelAccuracyDrop: true,
      dataQualityIssues: true,
      seasonalAnomalies: true,
      volumeSpikes: true,
    },
  })

  const [activeAlerts, setActiveAlerts] = useState([
    {
      id: 1,
      type: "warning",
      title: "Forecast Deviation Detected",
      message: "Sales forecast for next week shows 18% deviation from historical patterns",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      severity: "medium",
      acknowledged: false,
      category: "forecast",
    },
    {
      id: 2,
      type: "info",
      title: "Model Training Completed",
      message: "LSTM model training finished with 87.3% accuracy",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      severity: "low",
      acknowledged: true,
      category: "model",
    },
    {
      id: 3,
      type: "critical",
      title: "Data Quality Alert",
      message: "Missing data detected in last 24 hours of sales records",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      severity: "high",
      acknowledged: false,
      category: "data",
    },
  ])

  const [notificationHistory, setNotificationHistory] = useState([])

  useEffect(() => {
    // Simulate real-time alerts
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        // 5% chance every interval
        generateRandomAlert()
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const generateRandomAlert = () => {
    const alertTypes = [
      {
        type: "info",
        title: "Forecast Update Available",
        message: "New predictions generated based on latest data",
        severity: "low",
        category: "forecast",
      },
      {
        type: "warning",
        title: "Seasonal Pattern Change",
        message: "Detected shift in seasonal buying patterns",
        severity: "medium",
        category: "pattern",
      },
      {
        type: "success",
        title: "Model Performance Improved",
        message: "Latest model shows 2.3% accuracy improvement",
        severity: "low",
        category: "model",
      },
    ]

    const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)]
    const newAlert = {
      id: Date.now(),
      ...randomAlert,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    }

    setActiveAlerts((prev) => [newAlert, ...prev.slice(0, 9)]) // Keep only 10 most recent
  }

  const acknowledgeAlert = (alertId) => {
    setActiveAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, acknowledged: true } : alert)))
  }

  const dismissAlert = (alertId) => {
    setActiveAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }

  const updateAlertSettings = (category, field, value) => {
    setAlertSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }))

    // Update system config
    if (category === "thresholds") {
      onConfigUpdate((prevConfig) => ({
        ...prevConfig,
        alertThresholds: {
          ...prevConfig.alertThresholds,
          [field]: value,
        },
      }))
    }
  }

  const testNotification = async (type) => {
    const testAlert = {
      id: Date.now(),
      type: "info",
      title: `Test ${type.toUpperCase()} Notification`,
      message: `This is a test notification sent via ${type}`,
      timestamp: new Date().toISOString(),
      severity: "low",
      acknowledged: false,
      category: "test",
    }

    setActiveAlerts((prev) => [testAlert, ...prev])

    // Simulate sending notification
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Add to history
    setNotificationHistory((prev) => [
      {
        ...testAlert,
        deliveryMethod: type,
        status: "delivered",
      },
      ...prev.slice(0, 49), // Keep 50 most recent
    ])
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Bell className="h-4 w-4 text-blue-600" />
    }
  }

  const getAlertColor = (type) => {
    switch (type) {
      case "critical":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      case "success":
        return "border-green-200 bg-green-50"
      default:
        return "border-blue-200 bg-blue-50"
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <Bell className="h-6 w-6" />
            Notifications & Alert System
          </CardTitle>
          <CardDescription className="text-orange-700">
            Configure intelligent alerts and monitor system notifications for proactive decision making
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm text-orange-800">
              <Zap className="h-4 w-4" />
              Real-time monitoring
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-800">
              <Mail className="h-4 w-4" />
              Multi-channel delivery
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-800">
              <Target className="h-4 w-4" />
              Smart threshold detection
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="settings">Alert Settings</TabsTrigger>
          <TabsTrigger value="channels">Notification Channels</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {/* Alert Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Critical</p>
                    <p className="text-2xl font-bold text-red-900">
                      {activeAlerts.filter((a) => a.type === "critical" && !a.acknowledged).length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Warnings</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {activeAlerts.filter((a) => a.type === "warning" && !a.acknowledged).length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Info</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {activeAlerts.filter((a) => a.type === "info" && !a.acknowledged).length}
                    </p>
                  </div>
                  <Bell className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Success</p>
                    <p className="text-2xl font-bold text-green-900">
                      {activeAlerts.filter((a) => a.type === "success" && !a.acknowledged).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Active Alerts List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Monitor and manage system alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active alerts</p>
                  </div>
                ) : (
                  activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${getAlertColor(alert.type)} ${
                        alert.acknowledged ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{alert.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {alert.category}
                              </Badge>
                              {alert.acknowledged && (
                                <Badge variant="secondary" className="text-xs">
                                  Acknowledged
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(alert.timestamp)}
                              </span>
                              <span>Severity: {alert.severity}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!alert.acknowledged && (
                            <Button variant="outline" size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                              Acknowledge
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => dismissAlert(alert.id)}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Alert Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Thresholds</CardTitle>
              <CardDescription>Configure when alerts should be triggered</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Significant Forecast Deviation (%)</Label>
                  <Input
                    type="number"
                    value={alertSettings.thresholds.significantDeviation}
                    onChange={(e) =>
                      updateAlertSettings("thresholds", "significantDeviation", Number.parseFloat(e.target.value))
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Alert when forecast deviates by this percentage from historical patterns
                  </p>
                </div>

                <div>
                  <Label>Low Model Accuracy (%)</Label>
                  <Input
                    type="number"
                    value={alertSettings.thresholds.lowAccuracy}
                    onChange={(e) =>
                      updateAlertSettings("thresholds", "lowAccuracy", Number.parseFloat(e.target.value))
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Alert when model accuracy drops below this threshold</p>
                </div>

                <div>
                  <Label>High Volatility (%)</Label>
                  <Input
                    type="number"
                    value={alertSettings.thresholds.highVolatility}
                    onChange={(e) =>
                      updateAlertSettings("thresholds", "highVolatility", Number.parseFloat(e.target.value))
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Alert when data shows high volatility (coefficient of variation)
                  </p>
                </div>

                <div>
                  <Label>Data Quality Score (%)</Label>
                  <Input
                    type="number"
                    value={alertSettings.thresholds.dataQuality}
                    onChange={(e) =>
                      updateAlertSettings("thresholds", "dataQuality", Number.parseFloat(e.target.value))
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Alert when data quality score falls below this threshold</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alert Triggers */}
          <Card>
            <CardHeader>
              <CardTitle>Alert Triggers</CardTitle>
              <CardDescription>Choose which events should generate alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(alertSettings.triggers).map(([trigger, enabled]) => (
                  <div key={trigger} className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">
                        {trigger.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      </Label>
                      <p className="text-sm text-gray-600">
                        {trigger === "forecastDeviation" &&
                          "Alert when forecasts deviate significantly from expected patterns"}
                        {trigger === "modelAccuracyDrop" && "Alert when model performance degrades"}
                        {trigger === "dataQualityIssues" && "Alert when data quality problems are detected"}
                        {trigger === "seasonalAnomalies" && "Alert when seasonal patterns change unexpectedly"}
                        {trigger === "volumeSpikes" && "Alert when sales volume shows unusual spikes or drops"}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => updateAlertSettings("triggers", trigger, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Email Notifications</Label>
                <Switch
                  checked={alertSettings.email.enabled}
                  onCheckedChange={(checked) => updateAlertSettings("email", "enabled", checked)}
                />
              </div>

              {alertSettings.email.enabled && (
                <>
                  <div>
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      placeholder="your-email@company.com"
                      value={alertSettings.email.address}
                      onChange={(e) => updateAlertSettings("email", "address", e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Email Frequency</Label>
                    <Select
                      value={alertSettings.email.frequency}
                      onValueChange={(value) => updateAlertSettings("email", "frequency", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                        <SelectItem value="daily">Daily Summary</SelectItem>
                        <SelectItem value="critical">Critical Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={() => testNotification("email")} variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Test Email Notification
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* SMS Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                SMS Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable SMS Notifications</Label>
                <Switch
                  checked={alertSettings.sms.enabled}
                  onCheckedChange={(checked) => updateAlertSettings("sms", "enabled", checked)}
                />
              </div>

              {alertSettings.sms.enabled && (
                <>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={alertSettings.sms.number}
                      onChange={(e) => updateAlertSettings("sms", "number", e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>SMS Frequency</Label>
                    <Select
                      value={alertSettings.sms.frequency}
                      onValueChange={(value) => updateAlertSettings("sms", "frequency", value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical Only</SelectItem>
                        <SelectItem value="important">Critical & Important</SelectItem>
                        <SelectItem value="all">All Alerts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={() => testNotification("sms")} variant="outline">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Test SMS Notification
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* In-App Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                In-App Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable In-App Notifications</Label>
                <Switch
                  checked={alertSettings.inApp.enabled}
                  onCheckedChange={(checked) => updateAlertSettings("inApp", "enabled", checked)}
                />
              </div>

              {alertSettings.inApp.enabled && (
                <div>
                  <Label>Notification Level</Label>
                  <Select
                    value={alertSettings.inApp.frequency}
                    onValueChange={(value) => updateAlertSettings("inApp", "frequency", value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Notifications</SelectItem>
                      <SelectItem value="important">Important Only</SelectItem>
                      <SelectItem value="critical">Critical Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>View past notifications and delivery status</CardDescription>
            </CardHeader>
            <CardContent>
              {notificationHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notification history available</p>
                  <p className="text-sm">Test notifications to see delivery history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notificationHistory.map((notification) => (
                    <div key={notification.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            <span>{formatTimestamp(notification.timestamp)}</span>
                            <span>Via: {notification.deliveryMethod}</span>
                            <Badge variant={notification.status === "delivered" ? "default" : "destructive"}>
                              {notification.status}
                            </Badge>
                          </div>
                        </div>
                        {getAlertIcon(notification.type)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
