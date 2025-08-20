"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { Target, Award, Code, Clock } from "lucide-react"

export default function ModelEvaluation({ models }) {
  const [comparisonData, setComparisonData] = useState([])
  const [radarData, setRadarData] = useState([])
  const [bestModel, setBestModel] = useState(null)

  useEffect(() => {
    if (models && models.models) {
      generateComparison()
    }
  }, [models])

  const generateComparison = () => {
    const modelEntries = Object.entries(models.models)

    // Prepare comparison data
    const comparison = modelEntries.map(([id, model]) => ({
      name: model.name,
      accuracy: Number.parseFloat(model.accuracy),
      mse: Number.parseFloat(model.mse),
      mae: Number.parseFloat(model.mae),
      r2: Number.parseFloat(model.r2),
      trainingTime: Number.parseFloat(model.trainingTime),
      type: model.type,
      script: model.script,
      id,
    }))

    setComparisonData(comparison)

    // Prepare radar chart data
    const radar = comparison.map((model) => ({
      model: model.name,
      accuracy: model.accuracy * 100,
      r2: model.r2 * 100,
      speed: Math.max(0, 100 - (model.trainingTime / 30) * 100), // Inverse of training time
      stability: Math.max(0, 100 - model.mse * 1000), // Inverse of MSE
    }))

    setRadarData(radar)

    // Find best model (highest accuracy)
    const best = comparison.reduce((prev, current) => (prev.accuracy > current.accuracy ? prev : current))
    setBestModel(best)
  }

  const getPerformanceColor = (value, metric) => {
    if (metric === "accuracy" || metric === "r2") {
      return value > 0.8 ? "text-green-600" : value > 0.6 ? "text-yellow-600" : "text-red-600"
    } else if (metric === "mse" || metric === "mae") {
      return value < 0.05 ? "text-green-600" : value < 0.1 ? "text-yellow-600" : "text-red-600"
    }
    return "text-gray-600"
  }

  const getPerformanceBadge = (value, metric) => {
    if (metric === "accuracy" || metric === "r2") {
      if (value > 0.8) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
      if (value > 0.6) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
      return <Badge className="bg-red-100 text-red-800">Poor</Badge>
    } else if (metric === "mse" || metric === "mae") {
      if (value < 0.05) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
      if (value < 0.1) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
      return <Badge className="bg-red-100 text-red-800">Poor</Badge>
    }
    return null
  }

  if (!models) {
    return (
      <Alert>
        <AlertDescription>Please train models first to view evaluation results.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Model Performance Evaluation
          </CardTitle>
          <CardDescription>Compare and analyze the performance of trained models</CardDescription>
        </CardHeader>
      </Card>

      {bestModel && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Award className="h-5 w-5" />
              Best Performing Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-green-900">{bestModel.name}</h3>
                <p className="text-green-700">Highest accuracy: {(bestModel.accuracy * 100).toFixed(1)}%</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{bestModel.type}</Badge>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Code className="h-3 w-3" />
                    {bestModel.script}
                  </div>
                </div>
              </div>
              <Badge className="bg-green-600 text-white">Recommended</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Accuracy Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Training Time Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="trainingTime" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Performance Radar</CardTitle>
          <CardDescription>Multi-dimensional performance comparison across all models</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="model" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Accuracy" dataKey="accuracy" stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} />
              <Radar name="R²" dataKey="r2" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.1} />
              <Radar name="Speed" dataKey="speed" stroke="#ffc658" fill="#ffc658" fillOpacity={0.1} />
              <Radar name="Stability" dataKey="stability" stroke="#ff7300" fill="#ff7300" fillOpacity={0.1} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Model</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Script</th>
                  <th className="text-left p-3">Accuracy</th>
                  <th className="text-left p-3">MSE</th>
                  <th className="text-left p-3">MAE</th>
                  <th className="text-left p-3">R²</th>
                  <th className="text-left p-3">Training Time</th>
                  <th className="text-left p-3">Overall</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((model, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{model.name}</td>
                    <td className="p-3">
                      <Badge variant="outline">{model.type}</Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Code className="h-3 w-3" />
                        {model.script}
                      </div>
                    </td>
                    <td className={`p-3 font-semibold ${getPerformanceColor(model.accuracy, "accuracy")}`}>
                      {(model.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className={`p-3 ${getPerformanceColor(model.mse, "mse")}`}>{model.mse.toFixed(4)}</td>
                    <td className={`p-3 ${getPerformanceColor(model.mae, "mae")}`}>{model.mae.toFixed(4)}</td>
                    <td className={`p-3 ${getPerformanceColor(model.r2, "r2")}`}>{model.r2.toFixed(3)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {model.trainingTime.toFixed(1)}s
                      </div>
                    </td>
                    <td className="p-3">{getPerformanceBadge(model.accuracy, "accuracy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model Recommendations & Python Scripts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">For Production Use:</h4>
              <p className="text-blue-800">
                Choose the model with the highest accuracy and acceptable training time. The Python scripts provide full
                implementations with scikit-learn and TensorFlow.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">For Real-time Predictions:</h4>
              <p className="text-green-800">
                Decision trees (decision_tree_model.py) offer fast inference and good interpretability for business
                stakeholders.
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">For Complex Patterns:</h4>
              <p className="text-purple-800">
                Deep learning models (lstm_model.py, dense_nn_model.py, cnn_1d_model.py) excel at capturing complex
                temporal patterns in sales data.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">Python Script Usage:</h4>
              <p className="text-orange-800">
                All models are implemented in Python with proper data preprocessing, training, and evaluation. Run the
                scripts directly or integrate them into your ML pipeline.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
