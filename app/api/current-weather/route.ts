import { NextResponse, type NextRequest } from "next/server"

// Proxies OpenWeather Current Weather API using OPENWEATHER_API_KEY
// Usage: /api/current-weather?lat=12.97&lon=77.59&units=metric

const OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const lat = params.get("lat") || params.get("latitude")
    const lon = params.get("lon") || params.get("longitude")
    const units = params.get("units") || "metric"
    const apiKey = process.env.OPENWEATHER_API_KEY

    if (!lat || !lon) {
      return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 })
    }
    if (!apiKey) {
      return NextResponse.json({ error: "OPENWEATHER_API_KEY not configured" }, { status: 500 })
    }

    const url = new URL(OPENWEATHER_URL)
    url.searchParams.set("lat", lat)
    url.searchParams.set("lon", lon)
    url.searchParams.set("appid", apiKey)
    url.searchParams.set("units", units)

    const res = await fetch(url.toString(), { cache: "no-store" })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Upstream error ${res.status}: ${text}` }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to fetch current weather" }, { status: 500 })
  }
}


