"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"

// Simple coordinates map (Karnataka examples)
const DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = {
  Tumkur: { lat: 13.34, lon: 77.10 },
  Kolar: { lat: 13.13, lon: 78.23 },
  Mandya: { lat: 12.52, lon: 76.89 },
  Hassan: { lat: 13.01, lon: 76.10 },
  Chikkaballapur: { lat: 13.43, lon: 77.72 },
  Ramanagara: { lat: 12.72, lon: 77.28 },
  // Non-dataset examples remain available
  Bangalore: { lat: 12.97, lon: 77.59 },
  Mysore: { lat: 12.2958, lon: 76.6394 },
}

type WeatherMode = "auto" | "manual"

interface YieldPredictionProps {
  onBack: () => void
}

interface PredictionResult {
  yield: number
  confidence: number
  analysis: string
}

export default function YieldPrediction({ onBack }: YieldPredictionProps) {
  const [formData, setFormData] = useState({
    district: "",
    season: "",
    variety: "",
    soil_type: "",
    rainfall_mm: "",
    temperature_C: "",
    humidity_percent: "",
    area: "",
  })

  const [weatherMode, setWeatherMode] = useState<WeatherMode>("auto")
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [autoFilled, setAutoFilled] = useState(false)
  const [loadingWeather, setLoadingWeather] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Auto-fill weather-derived fields when in Auto mode and district changes
  useEffect(() => {
    async function autofillWeather() {
      const coords = DISTRICT_COORDS[formData.district as keyof typeof DISTRICT_COORDS]
      if (!coords) return
      setLoadingWeather(true)
      setAutoFilled(false)
      try {
        const qs = new URLSearchParams({ latitude: String(coords.lat), longitude: String(coords.lon) })
        const [seasonalRes, currentRes] = await Promise.all([
          fetch(`/api/seasonal-weather?${qs.toString()}`),
          fetch(`/api/current-weather?lat=${coords.lat}&lon=${coords.lon}&units=metric`),
        ])
        const seasonal = seasonalRes.ok ? await seasonalRes.json() : null
        const current = currentRes.ok ? await currentRes.json() : null

        let seasonalTemps: number[] | undefined
        let seasonalPrecip: number[] | undefined
        if (seasonal?.monthly || seasonal?.seasonal) {
          const monthly = seasonal.monthly || seasonal.seasonal
          seasonalTemps = monthly?.temperature_2m_max || monthly?.temperature_2m_mean || monthly?.t2m
          seasonalPrecip = monthly?.precipitation_sum || monthly?.tp
        }
        const avgTemp = seasonalTemps && seasonalTemps.length
          ? seasonalTemps.reduce((a: number, b: number) => a + b, 0) / seasonalTemps.length
          : undefined
        const totalPrecip = seasonalPrecip && seasonalPrecip.length
          ? seasonalPrecip.reduce((a: number, b: number) => a + b, 0)
          : undefined

        const nowTemp = typeof current?.main?.temp === "number" ? current.main.temp : undefined
        const nowHumidity = typeof current?.main?.humidity === "number" ? current.main.humidity : undefined

        const rainfallVal = totalPrecip ?? 800
        const tempVal = nowTemp ?? avgTemp ?? 28
        const humidVal = nowHumidity ?? 70

        setFormData((prev) => ({
          ...prev,
          rainfall_mm: String(Number(rainfallVal.toFixed ? rainfallVal.toFixed(1) : rainfallVal)),
          temperature_C: String(Number(tempVal.toFixed ? tempVal.toFixed(1) : tempVal)),
          humidity_percent: String(Number(humidVal.toFixed ? humidVal.toFixed(1) : humidVal)),
        }))
        setAutoFilled(true)
      } catch (e) {
        // keep fields unchanged on failure
      } finally {
        setLoadingWeather(false)
      }
    }

    if (weatherMode === "auto" && formData.district) {
      autofillWeather()
    }
  }, [formData.district, formData.season, weatherMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setResult(null)

    if (
      !formData.district ||
      !formData.season ||
      !formData.variety ||
      !formData.soil_type ||
      !formData.rainfall_mm ||
      !formData.temperature_C ||
      !formData.humidity_percent ||
      !formData.area
    ) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/predict-yield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district: formData.district,
          season: formData.season,
          variety: formData.variety,
          soil_type: formData.soil_type,
          rainfall_mm: Number.parseFloat(formData.rainfall_mm),
          temperature_C: Number.parseFloat(formData.temperature_C),
          humidity_percent: Number.parseFloat(formData.humidity_percent),
          area: Number.parseFloat(formData.area),
        }),
      })

      if (!response.ok) throw new Error("Prediction failed")
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError("Failed to generate prediction. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      {/* Title */}
      <h2 className="text-3xl font-bold text-foreground mb-2">Mango Yield Prediction</h2>
      <p className="text-muted-foreground mb-1">Enter farm details based on your dataset to predict yield</p>

      {/* Weather Input Mode */}
      <div className="mb-4">
        <Label htmlFor="weather_mode">Weather Input</Label>
        <div className="mt-2 flex items-center gap-3">
          <input
            id="weather_mode"
            type="checkbox"
            checked={weatherMode === "auto"}
            onChange={(e) => setWeatherMode(e.target.checked ? "auto" : "manual")}
          />
          <span className="text-sm">Auto (uncheck to enter manually)</span>
        </div>
        {weatherMode === "auto" && (
          <p className="text-xs text-muted-foreground mt-2">
            Rainfall, Temperature, and Humidity will be auto-filled from the selected district’s weather.
          </p>
        )}
      </div>

      {weatherMode === "auto" && loadingWeather && (
        <p className="text-xs text-muted-foreground mb-6">Fetching weather for the selected district…</p>
      )}
      {weatherMode === "auto" && !loadingWeather && autoFilled && (
        <p className="text-xs text-green-700 mb-6">Weather fields auto-filled from seasonal/current data</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* District */}
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select value={formData.district} onValueChange={(value) => handleSelectChange("district", value)}>
                  <SelectTrigger id="district">
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tumkur">Tumkur</SelectItem>
                    <SelectItem value="Kolar">Kolar</SelectItem>
                    <SelectItem value="Mandya">Mandya</SelectItem>
                    <SelectItem value="Hassan">Hassan</SelectItem>
                    <SelectItem value="Chikkaballapur">Chikkaballapur</SelectItem>
                    <SelectItem value="Ramanagara">Ramanagara</SelectItem>
                    <SelectItem value="Bangalore">Bangalore</SelectItem>
                    <SelectItem value="Mysore">Mysore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Season */}
              <div className="space-y-2">
                <Label htmlFor="season">Season</Label>
                <Select value={formData.season} onValueChange={(value) => handleSelectChange("season", value)}>
                  <SelectTrigger id="season">
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Summer">Summer</SelectItem>
                    <SelectItem value="Monsoon">Monsoon</SelectItem>
                    <SelectItem value="Winter">Winter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Variety */}
              <div className="space-y-2">
                <Label htmlFor="variety">Variety</Label>
                <Select value={formData.variety} onValueChange={(value) => handleSelectChange("variety", value)}>
                  <SelectTrigger id="variety">
                    <SelectValue placeholder="Select variety" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alphonso">Alphonso</SelectItem>
                    <SelectItem value="Kesar">Kesar</SelectItem>
                    <SelectItem value="Dasheri">Dasheri</SelectItem>
                    <SelectItem value="Banganapalli">Banganapalli</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Soil Type */}
              <div className="space-y-2">
                <Label htmlFor="soil_type">Soil Type</Label>
                <Select value={formData.soil_type} onValueChange={(value) => handleSelectChange("soil_type", value)}>
                  <SelectTrigger id="soil_type">
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Loamy">Loamy</SelectItem>
                    <SelectItem value="Sandy">Sandy</SelectItem>
                    <SelectItem value="Clay">Clay</SelectItem>
                    <SelectItem value="Sandy Loam">Sandy Loam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rainfall (mm) */}
              <div className="space-y-2">
                <Label htmlFor="rainfall_mm">Rainfall (mm)</Label>
                <Input
                  id="rainfall_mm"
                  name="rainfall_mm"
                  type="number"
                  step="0.1"
                  placeholder="Enter rainfall"
                  value={formData.rainfall_mm}
                  onChange={handleInputChange}
                  className="h-11"
                  disabled={weatherMode === "auto"}
                />
              </div>

              {/* Temperature (°C) */}
              <div className="space-y-2">
                <Label htmlFor="temperature_C">Average Temperature (°C)</Label>
                <Input
                  id="temperature_C"
                  name="temperature_C"
                  type="number"
                  step="0.1"
                  placeholder="Enter temperature"
                  value={formData.temperature_C}
                  onChange={handleInputChange}
                  className="h-11"
                  disabled={weatherMode === "auto"}
                />
              </div>

              {/* Humidity (%) */}
              <div className="space-y-2">
                <Label htmlFor="humidity_percent">Humidity (%)</Label>
                <Input
                  id="humidity_percent"
                  name="humidity_percent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="Enter humidity"
                  value={formData.humidity_percent}
                  onChange={handleInputChange}
                  className="h-11"
                  disabled={weatherMode === "auto"}
                />
              </div>

              {/* Area (hectares) */}
              <div className="space-y-2">
                <Label htmlFor="area">Farm Area (hectares)</Label>
                <Input
                  id="area"
                  name="area"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Enter area in hectares"
                  value={formData.area}
                  onChange={handleInputChange}
                  className="h-11"
                />
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Predicting...
                  </>
                ) : (
                  "Get Yield Prediction"
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Results */}
        <div>
          {result && (
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
              <h3 className="text-xl font-bold text-foreground mb-4">Prediction Result</h3>

              <div className="space-y-4">
                {/* Yield */}
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Estimated Yield</p>
                  <p className="text-3xl font-bold text-primary">
                    {result.yield.toFixed(1)} <span className="text-lg text-muted-foreground">units</span>
                  </p>
                </div>

                {/* Confidence */}
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Prediction Confidence</p>
                  <p className="text-2xl font-bold text-secondary">{result.confidence.toFixed(1)}%</p>
                </div>

                {/* Analysis */}
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Analysis</p>
                  <p className="text-sm text-foreground leading-relaxed">{result.analysis}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
