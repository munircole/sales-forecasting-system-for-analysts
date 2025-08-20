"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { TrendingUp, Target } from "lucide-react"

export default function Predictions({ data, models }) {
  const [selectedModel, setSelectedModel] = useState("")
  const [predictionPeriod, setPredictionPeriod] = useState("30")
  const [predictions, setPredictions] = useState(null)
  const [loading, setLoading] = useState(false)

  const generatePredictions = async () => {
    if (!models || !selectedModel) return

    setLoading(true)

    try {
      // Generate mock predictions based on model type
      const days = Number.parseInt(predictionPeriod)
      const model = models.models[selectedModel]

      // Base prediction logic varies by model type
      const baseValue = 1000 + Math.random() * 500
      const trend = (Math.random() - 0.5) * 10

      // Adjust based on model accuracy
      const accuracy = Number.parseFloat(model.accuracy)
      const confidenceMultiplier = accuracy > 0.8 ? 0.8 : accuracy > 0.6 ? 1.2 : 1.5

      const predictionData = Array.from({ length: days }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() + i + 1)

        const noise = (Math.random() - 0.5) * 100 * confidenceMultiplier
        const seasonal = Math.sin((i / 7) * 2 * Math.PI) * 50
        const value = baseValue + trend * i + seasonal + noise

        return {
          date: date.toLocaleDateString(),
          predicted: Math.max(0, value).toFixed(2),
          confidence_lower: Math.max(0, value - 100 * confidenceMultiplier).toFixed(2),
          confidence_upper: (value + 100 * confidenceMultiplier).toFixed(2),
          day: i + 1,
        }
      })

      // Generate historical comparison if data exists
      let historicalData = []
      if (data && data.rows.length > 0) {
        const targetColumn = models.targetColumn
        historicalData = data.rows.slice(-30).map((row, i) => ({
          date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
          actual: Number.parseFloat(row[targetColumn]) || 0,
          type: "historical",
        }))
      }

      const combinedData = [
        ...historicalData,
        ...predictionData.map((p) => ({
          date: p.date,
          predicted: Number.parseFloat(p.predicted),
          confidence_lower: Number.parseFloat(p.confidence_lower),
          confidence_upper: Number.parseFloat(p.confidence_upper),
          type: "prediction",
        })),
      ]

      setPredictions({
        model: model,
        data: predictionData,
        combined: combinedData,
        summary: {
          avgPrediction: (
            predictionData.reduce((sum, p) => sum + Number.parseFloat(p.predicted), 0) / predictionData.length
          ).toFixed(2),
          totalPredicted: predictionData.reduce((sum, p) => sum + Number.parseFloat(p.predicted), 0).toFixed(2),
          trend: trend > 0 ? "increasing" : "decreasing",
          confidence: `${(accuracy * 100).toFixed(0)}%`,
          modelType: model.type,
        },
      })
    } catch (error) {
      console.error("Prediction error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!models) {
    return (
      <Alert>
        <AlertDescription>Please train models first to generate predictions.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Predictions
          </CardTitle>
          <CardDescription>Generate future sales predictions using trained models</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Select Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a trained model" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(models.models).map(([id, model]) => (
                    <SelectItem key={id} value={id}>
                      {model.name} (Accuracy: {(Number.parseFloat(model.accuracy) * 100).toFixed(1)}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prediction Period (Days)</Label>
              <Select value={predictionPeriod} onValueChange={setPredictionPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={generatePredictions} disabled={!selectedModel || loading} className="w-full bg-green-700 text-white">
            <Target className="h-4 w-4 mr-2" />
            {loading ? "Generating Predictions..." : "Generate Predictions"}
          </Button>
        </CardContent>
      </Card>

      {predictions && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">${predictions.summary.avgPrediction}</div>
                <div className="text-sm text-gray-600">Avg Daily Prediction</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">${predictions.summary.totalPredicted}</div>
                <div className="text-sm text-gray-600">Total Predicted</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div
                  className={`text-2xl font-bold ${
                    predictions.summary.trend === "increasing" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {predictions.summary.trend === "increasing" ? "↗" : "↘"}
                </div>
                <div className="text-sm text-gray-600">Trend</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{predictions.summary.confidence}</div>
                <div className="text-sm text-gray-600">Model Confidence</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Prediction Visualization</CardTitle>
              <CardDescription>
                Historical data vs Future predictions with confidence intervals ({predictions.summary.modelType} Model)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={predictions.combined}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="actual" stroke="#8884d8" strokeWidth={2} name="Historical" />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Predicted"
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence_upper"
                    stroke="#ffc658"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    name="Upper Confidence"
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence_lower"
                    stroke="#ff7300"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    name="Lower Confidence"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Predictions Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={predictions.data.slice(0, 14)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="predicted" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Model Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Model Type:</span>
                      <span className="font-medium">{predictions.model.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Training Script:</span>
                      <span className="font-medium">{predictions.model.script}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Training Time:</span>
                      <span className="font-medium">{predictions.model.trainingTime}s</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Accuracy:</span>
                      <span className="font-medium">
                        {(Number.parseFloat(predictions.model.accuracy) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>MSE:</span>
                      <span className="font-medium">{predictions.model.mse}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>R² Score:</span>
                      <span className="font-medium">{predictions.model.r2}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
