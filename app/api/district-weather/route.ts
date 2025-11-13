import { NextResponse, type NextRequest } from "next/server"

// Karnataka district coordinates (extend as needed)
const DISTRICT_COORDS: Record<string, { lat: number; lon: number }> = {
  Tumkur: { lat: 13.34, lon: 77.1 },
  Kolar: { lat: 13.14, lon: 78.13 },
  Mandya: { lat: 12.52, lon: 76.9 },
  Hassan: { lat: 13.0, lon: 76.1 },
  Chikkaballapur: { lat: 13.43, lon: 77.73 },
  Ramanagara: { lat: 12.72, lon: 77.28 },
  Bangalore: { lat: 12.97, lon: 77.59 },
  Mysore: { lat: 12.2958, lon: 76.6394 },
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`Upstream error ${res.status}`)
  return res.json()
}

export async function GET(request: NextRequest) {
  try {
    const districtParam = request.nextUrl.searchParams.get("district")
    if (!districtParam) {
      return NextResponse.json({ error: "Missing district" }, { status: 400 })
    }
    // Normalize to match keys
    const key = districtParam.trim()
    const coords = DISTRICT_COORDS[key as keyof typeof DISTRICT_COORDS]
    if (!coords) {
      return NextResponse.json({ error: `Unknown district: ${districtParam}` }, { status: 404 })
    }

    const seasonalQs = new URLSearchParams({ latitude: String(coords.lat), longitude: String(coords.lon) })
    const currentQs = new URLSearchParams({ lat: String(coords.lat), lon: String(coords.lon), units: "metric" })

    const [seasonal, current] = await Promise.all([
      fetchJson(`${request.nextUrl.origin}/api/seasonal-weather?${seasonalQs.toString()}`),
      fetchJson(`${request.nextUrl.origin}/api/current-weather?${currentQs.toString()}`),
    ])

    // Build compact summary
    let seasonalTemps: number[] | undefined
    let seasonalPrecip: number[] | undefined
    if ((seasonal as any)?.monthly || (seasonal as any)?.seasonal) {
      const monthly = (seasonal as any).monthly || (seasonal as any).seasonal
      seasonalTemps = monthly?.temperature_2m_max || monthly?.temperature_2m_mean || monthly?.t2m
      seasonalPrecip = monthly?.precipitation_sum || monthly?.tp
    }
    const avg = (arr?: number[]) => (arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined)
    const sum = (arr?: number[]) => (arr && arr.length ? arr.reduce((a, b) => a + b, 0) : undefined)

    const summary = {
      district: key,
      latitude: coords.lat,
      longitude: coords.lon,
      avg_temperature_period_C: avg(seasonalTemps),
      total_precipitation_period_mm: sum(seasonalPrecip),
      current_temperature_C: (current as any)?.main?.temp,
      current_humidity_percent: (current as any)?.main?.humidity,
      timezone: (seasonal as any)?.timezone ?? process.env.TIMEZONE ?? "Asia/Kolkata",
    }

    return NextResponse.json({ summary, seasonal, current })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to fetch district weather" }, { status: 500 })
  }
}


