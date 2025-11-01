"use client"

import { useEffect, useRef } from "react"

interface Industry {
  id: string
  name: string
  lat: number
  lng: number
  type: string
  location: string
}

interface WasteMapProps {
  location: string
  industries: Industry[]
  userLocation?: { lat: number; lng: number }
}

export default function WasteMap({ location, industries, userLocation }: WasteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    // Dynamically load Leaflet CSS and JS
    if (!window.L) {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      document.head.appendChild(link)

      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"
      script.onload = () => initializeMap()
      document.head.appendChild(script)
    } else {
      initializeMap()
    }
  }, [])

  const initializeMap = () => {
    if (!mapContainer.current || !window.L) return

    const mapCenter = userLocation || (industries.length > 0 ? [industries[0].lat, industries[0].lng] : [13.34, 77.1])

    // Create map
    const map = window.L.map(mapContainer.current).setView(mapCenter, 11)

    // Add OpenStreetMap tiles
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map)

    // Add user location marker if available
    if (userLocation) {
      window.L.marker([userLocation.lat, userLocation.lng], {
        icon: window.L.icon({
          iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-green.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      })
        .bindPopup("<b>Your Location</b><br>Showing nearby buyers")
        .addTo(map)
    }

    // Add industry markers
    industries.forEach((industry) => {
      const iconUrl =
        industry.type === "Biofuel"
          ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-red.png"
          : industry.type === "Composting"
            ? "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-blue.png"
            : "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-orange.png"

      window.L.marker([industry.lat, industry.lng], {
        icon: window.L.icon({
          iconUrl,
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      })
        .bindPopup(`<b>${industry.name}</b><br><small>${industry.type}</small><br><small>${industry.location}</small>`)
        .addTo(map)
    })

    mapInstanceRef.current = map
  }

  return (
    <div
      ref={mapContainer}
      className="w-full h-96 rounded-lg border-2 border-primary/20 shadow-md"
      style={{ minHeight: "400px" }}
    />
  )
}
