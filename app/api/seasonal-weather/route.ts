import { NextResponse, type NextRequest } from "next/server"

const OPEN_METEO_SEASONAL_URL = process.env.OPEN_METEO_BASE_URL ||
  "https://seasonal-api.open-meteo.com/v1/seasonal"

function buildSeasonalUrl(params: URLSearchParams) {
  const url = new URL(OPEN_METEO_SEASONAL_URL)
  // Required
  const latitude = params.get("latitude") || process.env.LATITUDE || undefined
  const longitude = params.get("longitude") || process.env.LONGITUDE || undefined
  if (!latitude || !longitude) {
    throw new Error("Missing required query params: latitude, longitude")
  }

  const start = params.get("start")
  const end = params.get("end")
  // Fallback: next 3 full months window starting this month
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-based
  const firstOfMonth = new Date(year, month, 1)
  const threeMonthsLater = new Date(year, month + 3, 0) // last day of 3rd month window

  const startStr = start ?? firstOfMonth.toISOString().slice(0, 10)
  const endStr = end ?? threeMonthsLater.toISOString().slice(0, 10)

  const query: Record<string, string> = {
    latitude,
    longitude,
    start: startStr,
    end: endStr,
    temperature_2m_max: params.get("temperature_2m_max") ?? "true",
    precipitation_sum: params.get("precipitation_sum") ?? "true",
    timezone: params.get("timezone") ?? process.env.TIMEZONE ?? "Asia/Kolkata",
  }

  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value))
  return url.toString()
}

export async function GET(request: NextRequest) {
  try {
    const url = buildSeasonalUrl(request.nextUrl.searchParams)
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to fetch seasonal weather" }, { status: 400 })
  }
}


