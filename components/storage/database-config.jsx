"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Database,
  Shield,
  Zap,
  CheckCircle,
  AlertTriangle,
  Monitor,
  HardDrive,
  Wifi,
  Lock,
  RefreshCw,
} from "lucide-react"

export default function DatabaseConfig({ user }) {
  const [dbConfig, setDbConfig] = useState({
    type: "postgresql",
    host: "localhost",
    port: 5432,
    database: "sales_forecasting",
    username: "admin",
    password: "",
    ssl: true,
    poolSize: 20,
    timeout: 30000,
    encryption: true,
  })

  const [connectionStatus, setConnectionStatus] = useState({
    connected: true,
    lastCheck: new Date().toISOString(),
    latency: 45,
    activeConnections: 12,
    maxConnections: 100,
  })

  const [performance, setPerformance] = useState({
    queryTime: 125,
    throughput: 1250,
    cacheHitRate: 94.2,
    diskUsage: 68.5,
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const testConnection = async () => {
    setLoading(true)
    setMessage(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      setConnectionStatus((prev) => ({
        ...prev,
        connected: true,
        lastCheck: new Date().toISOString(),
        latency: Math.floor(Math.random() * 100) + 20,
      }))

      setMessage({ type: "success", text: "Database connection successful!" })
    } catch (error) {
      setConnectionStatus((prev) => ({ ...prev, connected: false }))
      setMessage({ type: "error", text: "Failed to connect to database" })
    } finally {
      setLoading(false)
    }
  }

  const saveConfiguration = async () => {
    setLoading(true)
    setMessage(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setMessage({ type: "success", text: "Database configuration saved successfully!" })
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save configuration" })
    } finally {
      setLoading(false)
    }
  }

  const optimizeDatabase = async () => {
    setLoading(true)
    setMessage(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000))

      setPerformance((prev) => ({
        ...prev,
        queryTime: Math.max(50, prev.queryTime - 20),
        cacheHitRate: Math.min(99, prev.cacheHitRate + 2),
        diskUsage: Math.max(50, prev.diskUsage - 5),
      }))

      setMessage({ type: "success", text: "Database optimization completed!" })
    } catch (error) {
      setMessage({ type: "error", text: "Optimization failed" })
    } finally {
      setLoading(false)
    }
  }

  const formatLatency = (ms) => {
    if (ms < 50) return { value: ms, color: "text-green-600", status: "Excellent" }
    if (ms < 100) return { value: ms, color: "text-yellow-600", status: "Good" }
    return { value: ms, color: "text-red-600", status: "Poor" }
  }

  const latencyInfo = formatLatency(connectionStatus.latency)

  return (
    <div className="space-y-6">
      {/* Database Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className={`${connectionStatus.connected ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200" : "bg-gradient-to-br from-red-50 to-red-100 border-red-200"}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${connectionStatus.connected ? "text-green-600" : "text-red-600"}`}>
                  Connection
                </p>
                <p className={`text-2xl font-bold ${connectionStatus.connected ? "text-green-900" : "text-red-900"}`}>
                  {connectionStatus.connected ? "Online" : "Offline"}
                </p>
                <p className={`text-xs ${connectionStatus.connected ? "text-green-700" : "text-red-700"}`}>
                  {latencyInfo.value}ms latency
                </p>
              </div>
              <Database className={`h-8 w-8 ${connectionStatus.connected ? "text-green-500" : "text-red-500"}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Active Connections</p>
                <p className="text-2xl font-bold text-blue-900">{connectionStatus.activeConnections}</p>
                <p className="text-xs text-blue-700">of {connectionStatus.maxConnections} max</p>
              </div>
              <Wifi className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Query Performance</p>
                <p className="text-2xl font-bold text-purple-900">{performance.queryTime}ms</p>
                <p className="text-xs text-purple-700">Average response time</p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Cache Hit Rate</p>
                <p className="text-2xl font-bold text-orange-900">{performance.cacheHitRate}%</p>
                <p className="text-xs text-orange-700">Query cache efficiency</p>
              </div>
              <HardDrive className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "error" ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="connection" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Connection Settings
              </CardTitle>
              <CardDescription>Configure your database connection parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dbType">Database Type</Label>
                  <select
                    id="dbType"
                    value={dbConfig.type}
                    onChange={(e) => setDbConfig((prev) => ({ ...prev, type: e.target.value }))}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="mongodb">MongoDB</option>
                    <option value="sqlite">SQLite</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="host">Host</Label>
                  <Input
                    id="host"
                    value={dbConfig.host}
                    onChange={(e) => setDbConfig((prev) => ({ ...prev, host: e.target.value }))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    value={dbConfig.port}
                    onChange={(e) => setDbConfig((prev) => ({ ...prev, port: Number.parseInt(e.target.value) }))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="database">Database Name</Label>
                  <Input
                    id="database"
                    value={dbConfig.database}
                    onChange={(e) => setDbConfig((prev) => ({ ...prev, database: e.target.value }))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={dbConfig.username}
                    onChange={(e) => setDbConfig((prev) => ({ ...prev, username: e.target.value }))}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={dbConfig.password}
                    onChange={(e) => setDbConfig((prev) => ({ ...prev, password: e.target.value }))}
                    className="mt-2"
                    placeholder="Enter database password"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">SSL Connection</Label>
                    <p className="text-sm text-gray-600">Use SSL/TLS for secure connections</p>
                  </div>
                  <Switch
                    checked={dbConfig.ssl}
                    onCheckedChange={(checked) => setDbConfig((prev) => ({ ...prev, ssl: checked }))}
                  />
                </div>

                <div>
                  <Label htmlFor="poolSize">Connection Pool Size</Label>
                  <Input
                    id="poolSize"
                    type="number"
                    value={dbConfig.poolSize}
                    onChange={(e) => setDbConfig((prev) => ({ ...prev, poolSize: Number.parseInt(e.target.value) }))}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-1">Maximum number of concurrent connections</p>
                </div>

                <div>
                  <Label htmlFor="timeout">Connection Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={dbConfig.timeout}
                    onChange={(e) => setDbConfig((prev) => ({ ...prev, timeout: Number.parseInt(e.target.value) }))}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={testConnection} disabled={loading} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  Test Connection
                </Button>
                <Button onClick={saveConfiguration} disabled={loading}>
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Monitor and optimize database performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{performance.queryTime}ms</div>
                  <div className="text-sm text-blue-800">Avg Query Time</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{performance.throughput}</div>
                  <div className="text-sm text-green-800">Queries/sec</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{performance.cacheHitRate}%</div>
                  <div className="text-sm text-purple-800">Cache Hit Rate</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{performance.diskUsage}%</div>
                  <div className="text-sm text-orange-800">Disk Usage</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Performance Recommendations</Label>
                  <div className="mt-2 space-y-2">
                    {performance.queryTime > 200 && (
                      <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                        <p className="text-sm text-yellow-800">
                          Query performance is slow. Consider adding indexes or optimizing queries.
                        </p>
                      </div>
                    )}
                    {performance.cacheHitRate < 90 && (
                      <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                        <p className="text-sm text-blue-800">
                          Cache hit rate is low. Consider increasing cache size or reviewing query patterns.
                        </p>
                      </div>
                    )}
                    {performance.diskUsage > 80 && (
                      <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                        <p className="text-sm text-red-800">
                          Disk usage is high. Consider archiving old data or expanding storage.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Button onClick={optimizeDatabase} disabled={loading}>
                  <Zap className="h-4 w-4 mr-2" />
                  {loading ? "Optimizing..." : "Optimize Database"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Database Security
              </CardTitle>
              <CardDescription>Configure security settings and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Data Encryption at Rest</Label>
                    <p className="text-sm text-gray-600">Encrypt stored data using AES-256</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={dbConfig.encryption}
                      onCheckedChange={(checked) => setDbConfig((prev) => ({ ...prev, encryption: checked }))}
                      disabled={true} // Always enabled for security
                    />
                    <Badge variant="secondary">Required</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">SSL/TLS Encryption</Label>
                    <p className="text-sm text-gray-600">Encrypt data in transit</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={dbConfig.ssl}
                      onCheckedChange={(checked) => setDbConfig((prev) => ({ ...prev, ssl: checked }))}
                    />
                    {dbConfig.ssl && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <Lock className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Security Status</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Database access logging enabled</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Failed login attempt monitoring active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Regular security backups scheduled</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Database firewall rules configured</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Database Monitoring
              </CardTitle>
              <CardDescription>Real-time monitoring and alerting for database health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Connection Status</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span
                          className={`ml-2 font-medium ${connectionStatus.connected ? "text-green-600" : "text-red-600"}`}
                        >
                          {connectionStatus.connected ? "Connected" : "Disconnected"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Last Check:</span>
                        <span className="ml-2 font-medium">
                          {new Date(connectionStatus.lastCheck).toLocaleTimeString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Latency:</span>
                        <span className={`ml-2 font-medium ${latencyInfo.color}`}>
                          {latencyInfo.value}ms ({latencyInfo.status})
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Active Connections:</span>
                        <span className="ml-2 font-medium">
                          {connectionStatus.activeConnections}/{connectionStatus.maxConnections}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Recent Activity</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      { time: "2 minutes ago", event: "Query optimization completed", type: "success" },
                      { time: "15 minutes ago", event: "Backup process started", type: "info" },
                      { time: "1 hour ago", event: "Connection pool expanded", type: "info" },
                      { time: "3 hours ago", event: "Security scan completed", type: "success" },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              activity.type === "success" ? "bg-green-500" : "bg-blue-500"
                            }`}
                          />
                          <span className="text-sm font-medium">{activity.event}</span>
                        </div>
                        <span className="text-xs text-gray-600">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
