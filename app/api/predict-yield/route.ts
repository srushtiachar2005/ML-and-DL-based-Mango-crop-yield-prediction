import { type NextRequest, NextResponse } from "next/server"

function titleCase(value: string) {
  if (!value) return value
  return value
    .split(/[_\s-]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(" ")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Accept either dataset-shaped payload or legacy UI payload
    const isDatasetShape =
      typeof body?.district === "string" &&
      typeof body?.season === "string" &&
      typeof body?.variety === "string" &&
      typeof body?.soil_type === "string" &&
      typeof body?.rainfall_mm !== "undefined" &&
      typeof body?.temperature_C !== "undefined" &&
      typeof body?.humidity_percent !== "undefined"

    if (!isDatasetShape) {
      // Validate legacy minimal inputs
      if (!body?.region || !body?.season) {
        return NextResponse.json({ error: "Invalid input parameters" }, { status: 400 })
      }
    }

    // Inputs from client (may be undefined/empty)
    const clientRain = Number(isDatasetShape ? body.rainfall_mm : body.rainfall)
    const clientTemp = Number(isDatasetShape ? body.temperature_C : body.temperature)
    const clientHum = Number(isDatasetShape ? body.humidity_percent : body.humidity)
    const lat = typeof body?.latitude === "number" ? String(body.latitude) : undefined
    const lon = typeof body?.longitude === "number" ? String(body.longitude) : undefined

    // Helper to fetch JSON with fail-safe
    async function fetchJson(url: string): Promise<any | null> {
      try {
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) return null
        return await res.json()
      } catch {
        return null
      }
    }

    // Derive weather if not provided or if Flask fallback is needed
    async function deriveWeather(): Promise<{ rainfall_mm: number; temperature_C: number; humidity_percent: number }> {
      // Seasonal (for rainfall/avg temp) + Current (for humidity/temp)
      const qs = new URLSearchParams()
      if (lat) qs.set("latitude", lat)
      if (lon) qs.set("longitude", lon)

      const seasonal = await fetchJson(`${request.nextUrl.origin}/api/seasonal-weather${qs.toString() ? `?${qs.toString()}` : ""}`)
      const currentQs = new URLSearchParams()
      if (lat) currentQs.set("lat", lat)
      if (lon) currentQs.set("lon", lon)
      currentQs.set("units", "metric")
      const current = await fetchJson(`${request.nextUrl.origin}/api/current-weather?${currentQs.toString()}`)

      // Extract values best-effort
      let seasonalTemps: number[] | undefined
      let seasonalPrecip: number[] | undefined
      if (seasonal?.monthly || seasonal?.seasonal) {
        const monthly = seasonal.monthly || seasonal.seasonal
        seasonalTemps = monthly?.temperature_2m_max || monthly?.temperature_2m_mean || monthly?.t2m
        seasonalPrecip = monthly?.precipitation_sum || monthly?.tp
      }
      const avgTemp = seasonalTemps?.length ? seasonalTemps.reduce((a: number, b: number) => a + b, 0) / seasonalTemps.length : undefined
      const totalPrecip = seasonalPrecip?.length ? seasonalPrecip.reduce((a: number, b: number) => a + b, 0) : undefined

      const nowTemp = typeof current?.main?.temp === "number" ? current.main.temp : undefined
      const nowHumidity = typeof current?.main?.humidity === "number" ? current.main.humidity : undefined

      return {
        rainfall_mm: Number.isFinite(clientRain) && clientRain > 0 ? clientRain : Number(totalPrecip ?? 800),
        temperature_C: Number.isFinite(clientTemp) && clientTemp > 0 ? clientTemp : Number(nowTemp ?? avgTemp ?? 28),
        humidity_percent: Number.isFinite(clientHum) && clientHum > 0 ? clientHum : Number(nowHumidity ?? 70),
      }
    }

    const basePayload = isDatasetShape
      ? {
          district: titleCase(String(body.district)),
          season: titleCase(String(body.season)),
          variety: titleCase(String(body.variety)),
          soil_type: titleCase(String(body.soil_type)),
        }
      : {
          district: titleCase(String(body.region)),
          season: titleCase(String(body.season)),
          variety: "Alphonso",
          soil_type: "Loamy",
        }

    const flaskBase = process.env.FLASK_API_URL || "http://127.0.0.1:5000"
    // Try model first
    try {
      const weather = await deriveWeather()
      const payload = {
        ...basePayload,
        rainfall_mm: weather.rainfall_mm,
        temperature_C: weather.temperature_C,
        humidity_percent: weather.humidity_percent,
      }
      const response = await fetch(`${flaskBase.replace(/\/$/, "")}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      })
      if (response.ok) {
        const prediction = await response.json()
        const predYield = typeof prediction?.yield === "number" ? prediction.yield : null
        const area = Number(body?.area)
        const scaledYield = Number.isFinite(area) && area > 0 && typeof predYield === "number" ? predYield * area : predYield
        const analysis = `Predicted yield using trained model. Season: ${basePayload.season}.`
        return NextResponse.json({ yield: scaledYield, confidence: 85, analysis })
      }
      // fallthrough to heuristic
    } catch (_) {
      // fallthrough
    }

    // Heuristic fallback using derived weather, so UI keeps working without model
    const weather = await deriveWeather()
    const rain = weather.rainfall_mm
    const temp = weather.temperature_C
    const hum = weather.humidity_percent
    const seasonAdj: Record<string, number> = { Summer: 1.1, Monsoon: 1.0, Winter: 0.85 }
    const seasonFactor = seasonAdj[basePayload.season] ?? 1.0
    let rf = 1.0
    if (rain < 400) rf = 0.6
    else if (rain < 800) rf = 0.9
    else if (rain <= 1200) rf = 1.15
    else if (rain <= 1500) rf = 1.0
    else rf = 0.75
    let tf = 1.0
    if (temp < 20) tf = 0.7
    else if (temp < 24) tf = 0.9
    else if (temp <= 28) tf = 1.1
    else if (temp <= 32) tf = 0.9
    else tf = 0.6
    let hf = 1.0
    if (hum < 40) hf = 0.75
    else if (hum < 60) hf = 0.95
    else if (hum <= 75) hf = 1.1
    else if (hum <= 85) hf = 0.95
    else hf = 0.75
    const heuristicPerHectare = Math.max(0, 12 * seasonFactor * rf * tf * hf)
    const area = Number(body?.area)
    const heuristicYield = Number.isFinite(area) && area > 0 ? heuristicPerHectare * area : heuristicPerHectare
    const analysis = `Predicted yield using weather-derived heuristic. Season: ${basePayload.season}.`
    return NextResponse.json({ yield: heuristicYield, confidence: 70, analysis })
  } catch (error) {
    console.error("Prediction error:", error)
    // Final safety-net heuristic so the UI never breaks
    try {
      const season = "Monsoon"
      const rain = 800
      const temp = 28
      const hum = 70
      const seasonAdj: Record<string, number> = { Summer: 1.1, Monsoon: 1.0, Winter: 0.85 }
      const seasonFactor = seasonAdj[season] ?? 1.0
      let rf = 1.15
      let tf = 1.1
      let hf = 1.1
      const heuristicYield = Math.max(0, 12 * seasonFactor * rf * tf * hf)
      return NextResponse.json({ yield: heuristicYield, confidence: 65, analysis: `Heuristic fallback used. Season: ${season}.` })
    } catch {
      return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 })
    }
  }
}
