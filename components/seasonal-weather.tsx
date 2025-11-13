"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type SeasonalResponse = Record<string, any>

export default function SeasonalWeather() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SeasonalResponse | null>(null)

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported in this browser")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setError("Unable to access location"),
      { enableHighAccuracy: false, maximumAge: 600_000, timeout: 10_000 }
    )
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!coords) return
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          latitude: String(coords.lat),
          longitude: String(coords.lon),
        })
        const res = await fetch(`/api/seasonal-weather?${params.toString()}`)
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const json = await res.json()
        setData(json)
      } catch (e: any) {
        setError(e?.message ?? "Failed to load seasonal weather")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [coords])

  const summary = useMemo(() => {
    if (!data) return null
    // Best-effort extraction across possible response shapes
    const monthly = (data as any).monthly || (data as any).seasonal || {}
    const temps: number[] | undefined =
      monthly?.temperature_2m_max || monthly?.temperature_2m_mean || monthly?.t2m || undefined
    const precip: number[] | undefined = monthly?.precipitation_sum || monthly?.tp || undefined

    const avg = (arr?: number[]) => (arr && arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined)

    return {
      avgTemp: avg(temps),
      totalPrecip: precip && precip.length ? precip.reduce((a, b) => a + b, 0) : undefined,
    }
  }, [data])

  return (
    <Card className="p-6 border-2 border-border">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold mb-1">Seasonal Weather (Auto)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Forecast window for your location using Open-Meteo Seasonal API
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCoords(null)
            setData(null)
            setError(null)
            if ("geolocation" in navigator) {
              navigator.geolocation.getCurrentPosition(
                (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                () => setError("Unable to access location")
              )
            }
          }}
        >
          Refresh
        </Button>
      </div>

      {!coords && !error && <p className="text-sm">Detecting location…</p>}
      {loading && <p className="text-sm">Loading seasonal forecast…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && data && (
        <div className="mt-3 space-y-2 text-sm">
          {summary?.avgTemp !== undefined && (
            <div>
              <span className="font-medium">Avg temperature (period): </span>
              {summary.avgTemp.toFixed(1)}°C
            </div>
          )}
          {summary?.totalPrecip !== undefined && (
            <div>
              <span className="font-medium">Total precipitation (period): </span>
              {summary.totalPrecip.toFixed(1)} mm
            </div>
          )}
          {/* Fallback raw */}
          {summary?.avgTemp === undefined && summary?.totalPrecip === undefined && (
            <pre className="mt-2 max-h-64 overflow-auto rounded border p-2 text-xs bg-muted/40">
{JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </Card>
  )
}


