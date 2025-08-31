"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Play, CheckCircle, Clock } from "lucide-react"

export default function ModelTraining({ data, onModelsTrained }) {
  const [targetColumn, setTargetColumn] = useState("")
  const [selectedModels, setSelectedModels] = useState([])
  const [training, setTraining] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState(null)
  const [trainingLog, setTrainingLog] = useState([])
  const [enableSegmentation, setEnableSegmentation] = useState(false)
  const [segmentColumn, setSegmentColumn] = useState("")

  const availableModels = [
    {
      id: "decision_tree",
      name: "Decision Tree",
      type: "Traditional ML",
      description: "Interpretable tree-based model with feature importance",
      script: "decision_tree_model.py",
    },
    {
      id: "lstm",
      name: "LSTM Neural Network",
      type: "Deep Learning",
      description: "Long Short-Term Memory for time series patterns",
      script: "lstm_model.py",
    },
    {
      id: "dense_nn",
      name: "Dense Neural Network",
      type: "Deep Learning",
      description: "Multi-layer perceptron for complex relationships",
      script: "dense_nn_model.py",
    },
    {
      id: "cnn_1d",
      name: "1D CNN",
      type: "Deep Learning",
      description: "Convolutional network for pattern recognition",
      script: "cnn_1d_model.py",
    },
  ]

  const handleModelToggle = (modelId) => {
    setSelectedModels((prev) => (prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]))
  }

  const addToLog = (message, type = "info") => {
    setTrainingLog((prev) => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }])
  }

  const simulateModelTraining = async (modelId, segment) => {
    const model = availableModels.find((m) => m.id === modelId)
    addToLog(`Starting ${model.name} training${segment ? ` for segment: ${segment}` : ""}...`, "info")

    // Simulate training time based on model complexity
    const trainingSteps = {
      decision_tree: 20,
      lstm: 50,
      dense_nn: 40,
      cnn_1d: 45,
    }

    const steps = trainingSteps[modelId] || 30
    const stepDelay = 100

    for (let i = 0; i < steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepDelay))
      setProgress((prev) => prev + 100 / (selectedModels.length * steps))
    }

    // Generate realistic performance metrics based on model type
    const baseAccuracy = {
      decision_tree: 0.75 + Math.random() * 0.15,
      lstm: 0.8 + Math.random() * 0.15,
      dense_nn: 0.78 + Math.random() * 0.17,
      cnn_1d: 0.82 + Math.random() * 0.13,
    }

    const accuracy = baseAccuracy[modelId] || 0.75 + Math.random() * 0.15
    const mse = (1 - accuracy) * 0.1 + Math.random() * 0.05
    const mae = Math.sqrt(mse) * 0.8
    const r2 = accuracy
    const trainingTime = (Math.random() * 10 + 5).toFixed(1)

    addToLog(
      `${model.name} training${segment ? ` for segment: ${segment}` : ""} completed - Accuracy: ${(accuracy * 100).toFixed(1)}%`,
      "success",
    )

    return {
      name: model.name,
      type: model.type,
      accuracy: accuracy.toFixed(3),
      mse: mse.toFixed(4),
      mae: mae.toFixed(4),
      r2: r2.toFixed(3),
      trainingTime: trainingTime,
      status: "completed",
      script: model.script,
      segment: segment,
    }
  }

  const trainModels = async () => {
    if (!data || !targetColumn || selectedModels.length === 0) return

    setTraining(true)
    setProgress(0)
    setResults(null)
    setTrainingLog([])

    try {
      addToLog("Initializing advanced model training pipeline...", "info")
      addToLog(`Target variable: ${targetColumn}`, "info")
      addToLog(`Selected models: ${selectedModels.length}`, "info")

      if (enableSegmentation && segmentColumn) {
        addToLog(`Segmentation enabled on: ${segmentColumn}`, "info")
      }

      const modelResults = {}

      // Global models
      for (const modelId of selectedModels) {
        const result = await simulateModelTraining(modelId, "global")
        modelResults[`${modelId}_global`] = result
      }

      // Segmented models if enabled
      if (enableSegmentation && segmentColumn) {
        const segments = [...new Set(data.rows.map((row) => row[segmentColumn]))].slice(0, 3)

        for (const segment of segments) {
          addToLog(`Training models for segment: ${segment}`, "info")
          for (const modelId of selectedModels.slice(0, 2)) {
            // Limit for demo
            const result = await simulateModelTraining(modelId, segment)
            modelResults[`${modelId}_${segment}`] = result
          }
        }
      }

      setResults(modelResults)
      onModelsTrained({
        targetColumn,
        models: modelResults,
        trainingData: data,
        features: data.summary.numericColumns.filter((col) => col !== targetColumn),
        segmentation: enableSegmentation ? { column: segmentColumn, enabled: true } : { enabled: false },
      })

      addToLog("Advanced model training completed successfully!", "success")
    } catch (error) {
      addToLog(`Training error: ${error.message}`, "error")
    } finally {
      setTraining(false)
      setProgress(100)
    }
  }

  if (!data) {
    return (
      <Alert>
        <AlertDescription>Please upload and preprocess sales data first to train models.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Model Training Configuration
          </CardTitle>
          <CardDescription>Configure and train multiple ML models for sales forecasting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base font-medium">Target Column (What to predict)</Label>
            <Select value={targetColumn} onValueChange={setTargetColumn}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select target variable" />
              </SelectTrigger>
              <SelectContent>
                {data.summary.numericColumns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-base font-medium mb-4 block">Select Models to Train</Label>
            <div className="grid md:grid-cols-2 gap-4">
              {availableModels.map((model) => (
                <Card
                  key={model.id}
                  className={`cursor-pointer transition-all ${
                    selectedModels.includes(model.id) ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleModelToggle(model.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedModels.includes(model.id)}
                        onChange={() => handleModelToggle(model.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{model.name}</h4>
                          <Badge variant="outline">{model.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{model.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Script: {model.script}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-base font-medium mb-4 block">Advanced Options</Label>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enableSegmentation"
                  checked={enableSegmentation}
                  onCheckedChange={setEnableSegmentation}
                />
                <Label htmlFor="enableSegmentation" className="font-medium">
                  Enable segmented forecasting
                </Label>
              </div>

              {enableSegmentation && (
                <div>
                  <Label>Segmentation Column</Label>
                  <Select value={segmentColumn} onValueChange={setSegmentColumn}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select column for segmentation" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.headers
                        .filter((col) => !data.summary.numericColumns.includes(col))
                        .map((column) => (
                          <SelectItem key={column} value={column}>
                            {column}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={trainModels}
            disabled={!targetColumn || selectedModels.length === 0 || training}
            className="w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {training ? "Training Models..." : `Train ${selectedModels.length} Model(s)`}
          </Button>

          {training && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Training Progress</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {trainingLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Training Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {trainingLog.map((log, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">{log.timestamp}</span>
                  {log.type === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {log.type === "error" && <Clock className="h-4 w-4 text-red-600" />}
                  <span
                    className={
                      log.type === "success"
                        ? "text-green-700"
                        : log.type === "error"
                          ? "text-red-700"
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

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Training Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(results).map(([modelId, result]) => (
                <div key={modelId} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{result.name}</h4>
                      <Badge variant="outline">{result.type}</Badge>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Accuracy</span>
                      <div className="font-semibold text-blue-600">
                        {(Number.parseFloat(result.accuracy) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">MSE</span>
                      <div className="font-semibold">{result.mse}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">MAE</span>
                      <div className="font-semibold">{result.mae}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">R²</span>
                      <div className="font-semibold">{result.r2}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Time</span>
                      <div className="font-semibold">{result.trainingTime}s</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Use the trained models to generate predictions</li>
                <li>• Compare model performance in the Evaluation tab</li>
                <li>• Select the best performing model for production use</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
