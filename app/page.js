"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, BarChart3, Brain, Target, TrendingUp, Settings, FileText, Bell, User, Database } from "lucide-react"
import LoginForm from "@/components/auth/login-form"
import UserProfile from "@/components/auth/user-profile"
import DataUpload from "@/components/data-upload"
import DataPreprocessing from "@/components/data-preprocessing"
import Analytics from "@/components/analytics"
import ModelTraining from "@/components/model-training"
import Predictions from "@/components/predictions"
import AdvancedForecasting from "@/components/advanced-forecasting"
import ModelEvaluation from "@/components/model-evaluation"
import ReportsExports from "@/components/reports-exports"
import NotificationsAlerts from "@/components/notifications-alerts"
import SystemSettings from "@/components/system-settings"
import DataStorage from "@/components/storage/data-storage"
import DatabaseConfig from "@/components/storage/database-config"

export default function SalesForecastingSystem() {
  const [user, setUser] = useState(null)
  const [uploadedData, setUploadedData] = useState(null)
  const [preprocessedData, setPreprocessedData] = useState(null)
  const [trainedModels, setTrainedModels] = useState(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [showProfile, setShowProfile] = useState(false)
  const [systemConfig, setSystemConfig] = useState({
    targetAccuracy: 85,
    forecastHorizons: ["daily", "weekly", "monthly", "yearly"],
    alertThresholds: {
      significantDeviation: 15,
      lowAccuracy: 80,
    },
    integrations: {
      erp: false,
      pos: false,
      crm: false,
    },
  })

  // Check for existing authentication on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const authToken = localStorage.getItem("authToken")

    if (storedUser && authToken) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      } catch (error) {
        console.error("Error parsing stored user data:", error)
        localStorage.removeItem("user")
        localStorage.removeItem("authToken")
      }
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleRegister = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("authToken")
    setUser(null)
    setUploadedData(null)
    setPreprocessedData(null)
    setTrainedModels(null)
    setActiveTab("upload")
    setShowProfile(false)
  }

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  const handleDataUploaded = (data) => {
    setUploadedData(data)
    setActiveTab("preprocessing")
  }

  const handleDataProcessed = (data) => {
    setPreprocessedData(data)
    setActiveTab("analytics")
  }

  const handleModelsTraining = (models) => {
    setTrainedModels(models)
    setActiveTab("predictions")
  }

  const getTabStatus = (tab) => {
    switch (tab) {
      case "upload":
        return uploadedData ? "completed" : "current"
      case "preprocessing":
        return preprocessedData ? "completed" : uploadedData ? "current" : "disabled"
      case "analytics":
        return preprocessedData || uploadedData ? "current" : "disabled"
      case "training":
        return preprocessedData || uploadedData ? "current" : "disabled"
      case "predictions":
        return trainedModels ? "current" : "disabled"
      case "evaluation":
        return trainedModels ? "current" : "disabled"
      case "reports":
        return trainedModels ? "current" : "disabled"
      case "notifications":
        return "current"
      case "settings":
        return "current"
      case "storage":
        return "current"
      case "database":
        return user?.permissions?.includes("admin") ? "current" : "disabled"
      default:
        return "disabled"
    }
  }

  // Show login form if user is not authenticated
  if (!user) {
    return <LoginForm onLogin={handleLogin} onRegister={handleRegister} />
  }

  // Show user profile if requested
  if (showProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-green-100">
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
              <button
                onClick={() => setShowProfile(false)}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <UserProfile user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-green-100">
      {/* Enhanced Header with User Info */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-600 bg-clip-text text-transparent mb-1">
                Predictive Sales Forecasting System
              </h1>
              <p className="text-sm text-gray-600">ML-powered sales analytics and predictions</p>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-600">{user.company}</p>
              </div>
              <button
                onClick={() => setShowProfile(true)}
                className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
              >
                <User className="h-5 w-5 text-green-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full h-[40px] grid-cols-8 mb-8 bg-white/60 backdrop-blur-sm  rounded-xl shadow-lg">
            {[
              {
                id: "upload",
                icon: Upload,
                label: "Data Import",
              },
              { id: "preprocessing", icon: Settings, label: "Preprocessing" },
              { id: "analytics", icon: BarChart3, label: "EDA" },
              { id: "training", icon: Brain, label: "ML Training" },
              { id: "predictions", icon: TrendingUp, label: "Forecasting" },
              { id: "evaluation", icon: Target, label: "Evaluation" },
              { id: "reports", icon: FileText, label: "Reports" },
              //{ id: "notifications", icon: Bell, label: "Alerts" },
              //{ id: "storage", icon: Database, label: "Storage" },
              //{ id: "database", icon: Database, label: "Database" },
              //{ id: "settings", icon: Settings, label: "System Config" },
            ].map(({ id, icon: Icon, label }) => {
              const status = getTabStatus(id)
              return (
                <TabsTrigger
                  key={id}
                  value={id}
                  disabled={status === "disabled"}
                  className={`flex items-center gap-2 p-4 rounded-lg transition-all duration-200 text-xs 
                    ${status === "completed" ? "bg-green-100 text-green-700 border border-green-200" : ""}
                    ${status === "current" ? "bg-blue-100 text-blue-700 border border-blue-200" : ""}
                    ${status === "disabled" ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden xl:inline">{label}</span>
                  {status === "completed" && <div className="w-2 h-2 bg-green-500 rounded-full ml-1"></div>}
                </TabsTrigger>
              )
            })}
          </TabsList>

          <div className="space-y-6">
            <TabsContent value="upload" className="mt-0">
              <DataUpload onDataUploaded={handleDataUploaded} systemConfig={systemConfig} />
            </TabsContent>

            <TabsContent value="preprocessing" className="mt-0">
              <DataPreprocessing data={uploadedData} onDataProcessed={handleDataProcessed} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <Analytics data={preprocessedData || uploadedData} />
            </TabsContent>

            <TabsContent value="training" className="mt-0">
              <ModelTraining
                data={preprocessedData || uploadedData}
                onModelsTrained={handleModelsTraining}
                systemConfig={systemConfig}
              />
            </TabsContent>

            <TabsContent value="predictions" className="mt-0">
              <div className="space-y-6">
                {/* Basic Predictions */}
                <Predictions
                  data={preprocessedData || uploadedData}
                  models={trainedModels}
                  systemConfig={systemConfig}
                />

                {/* Advanced Forecasting */}
                <AdvancedForecasting
                  data={preprocessedData || uploadedData}
                  onForecastGenerated={(forecast) => console.log("Advanced forecast generated:", forecast)}
                />
              </div>
            </TabsContent>

            <TabsContent value="evaluation" className="mt-0">
              <ModelEvaluation models={trainedModels} systemConfig={systemConfig} />
            </TabsContent>

            <TabsContent value="reports" className="mt-0">
              <ReportsExports
                data={preprocessedData || uploadedData}
                models={trainedModels}
                systemConfig={systemConfig}
              />
            </TabsContent>

            {/*<TabsContent value="notifications" className="mt-0">
              <NotificationsAlerts
                models={trainedModels}
                systemConfig={systemConfig}
                onConfigUpdate={setSystemConfig}
              />
            </TabsContent>

            <TabsContent value="storage" className="mt-0">
              <DataStorage user={user} />
            </TabsContent>

            <TabsContent value="database" className="mt-0">
              <DatabaseConfig user={user} />
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <SystemSettings config={systemConfig} onConfigUpdate={setSystemConfig} />
            </TabsContent>*/}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
