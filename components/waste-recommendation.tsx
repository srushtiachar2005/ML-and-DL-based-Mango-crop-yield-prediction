"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  ArrowLeft,
  Loader2,
  Lightbulb,
  MapPin,
  Weight,
  Navigation,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"
import WasteMap from "./waste-map"

interface WasteRecommendationProps {
  onBack: () => void
}

interface Recommendation {
  use_case: string
  description: string
  benefits: string[]
  process: string
}

interface Industry {
  id: string
  name: string
  lat: number
  lng: number
  type: string
  location: string
}

const wasteTypes = [
  "Mango Peel",
  "Mango Seed",
  "Mango Husk",
  "Sugarcane Bagasse",
  "Paddy Straw",
  "Corn Husk",
  "Coconut Husk",
  "Mango Leaves",
  "Mango Branches",
  "Orchard Trimmings",
  "Other",
]

const industryDatabase: Record<string, Industry[]> = {
  bangalore: [
    {
      id: "bio1",
      name: "GreenFiber Pvt Ltd",
      lat: 13.0827,
      lng: 77.6033,
      type: "Biomass & Compost",
      location: "Bangalore",
    },
    {
      id: "bio2",
      name: "BioFuel Co.",
      lat: 13.1939,
      lng: 77.5941,
      type: "Biofuel",
      location: "Bangalore",
    },
    {
      id: "bio3",
      name: "Eco-Waste Solutions",
      lat: 12.9716,
      lng: 77.5946,
      type: "Waste Processing",
      location: "Bangalore",
    },
  ],
  tumkur: [
    {
      id: "tum1",
      name: "EcoFuel Unit - Tumkur",
      lat: 13.334,
      lng: 77.1014,
      type: "Biofuel",
      location: "Tumkur",
    },
    {
      id: "tum2",
      name: "GreenFiber Tumkur",
      lat: 13.3167,
      lng: 77.1215,
      type: "Fiber Extraction",
      location: "Tumkur",
    },
    {
      id: "tum3",
      name: "Organic Farms Trading",
      lat: 13.3489,
      lng: 77.1189,
      type: "Organic Products",
      location: "Tumkur",
    },
  ],
  mysore: [
    {
      id: "mys1",
      name: "Karnataka Bio-Products",
      lat: 12.2958,
      lng: 76.6394,
      type: "Agricultural Waste",
      location: "Mysore",
    },
    {
      id: "mys2",
      name: "Mysore Compost Works",
      lat: 12.3103,
      lng: 76.6552,
      type: "Composting",
      location: "Mysore",
    },
    {
      id: "mys3",
      name: "Sustainable Agri Ltd",
      lat: 12.2675,
      lng: 76.6245,
      type: "Eco-Products",
      location: "Mysore",
    },
  ],
  hassan: [
    {
      id: "has1",
      name: "Hassan Biomass Center",
      lat: 13.1938,
      lng: 75.7389,
      type: "Biomass Processing",
      location: "Hassan",
    },
    {
      id: "has2",
      name: "Agri-Waste Pvt Ltd",
      lat: 13.2084,
      lng: 75.7447,
      type: "Waste Management",
      location: "Hassan",
    },
  ],
}

export default function WasteRecommendation({ onBack }: WasteRecommendationProps) {
  const [waste, setWaste] = useState("")
  const [quantity, setQuantity] = useState("")
  const [location, setLocation] = useState("")
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [industries, setIndustries] = useState<Industry[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [locatingUser, setLocatingUser] = useState(false)
  const [error, setError] = useState("")
  const [searched, setSearched] = useState(false)
  const [geolocationError, setGeolocationError] = useState("")

  const handleUseMyLocation = () => {
    setLocatingUser(true)
    setGeolocationError("")

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          setLocatingUser(false)
          // Auto-populate location as coordinates
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        },
        (error) => {
          setGeolocationError("Unable to access your location. Please enable location services.")
          setLocatingUser(false)
        },
      )
    } else {
      setGeolocationError("Geolocation is not supported by your browser.")
      setLocatingUser(false)
    }
  }

  const fetchIndustriesByLocation = (loc: string) => {
    if (!loc.trim()) {
      setIndustries([])
      return
    }

    const normalizedLocation = loc.toLowerCase().trim()
    let matchedIndustries: Industry[] = []

    // Check for exact location match
    if (industryDatabase[normalizedLocation]) {
      matchedIndustries = industryDatabase[normalizedLocation]
    } else {
      // Try partial matches
      for (const [key, value] of Object.entries(industryDatabase)) {
        if (normalizedLocation.includes(key) || key.includes(normalizedLocation)) {
          matchedIndustries = value
          break
        }
      }
    }

    setIndustries(matchedIndustries)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setRecommendations([])

    if (!waste.trim()) {
      setError("Please select a type of waste")
      return
    }

    if (!quantity.trim()) {
      setError("Please enter the quantity in kg")
      return
    }

    setLoading(true)
    setSearched(true)
    try {
      const response = await fetch("/api/waste-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waste: waste.trim(), quantity, location }),
      })

      if (!response.ok) throw new Error("Failed to fetch recommendations")
      const data = await response.json()
      setRecommendations(data.recommendations)

      if (location.trim()) {
        fetchIndustriesByLocation(location)
      }
    } catch (err) {
      setError("Failed to get recommendations. Please try again.")
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

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">♻️</span>
          <h2 className="text-3xl font-bold text-foreground">Waste Reuse Advisor</h2>
        </div>
        <p className="text-muted-foreground">
          Discover sustainable ways to reuse your agricultural waste and find nearby buyers
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Waste Type Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="waste">Type of Waste</Label>
                <select
                  id="waste"
                  value={waste}
                  onChange={(e) => setWaste(e.target.value)}
                  className="w-full h-11 px-3 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select waste type...</option>
                  {wasteTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Input */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="flex items-center gap-2">
                  <Weight size={16} /> Quantity (kg)
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="e.g., 50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  step="0.1"
                  className="h-11"
                />
              </div>

              {/* Location Input with Geolocation */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin size={16} /> Location
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    type="text"
                    placeholder="e.g., Bangalore, Tumkur..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-11 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleUseMyLocation}
                    disabled={locatingUser}
                    title="Use your current location"
                    className="h-11 w-11 bg-transparent"
                  >
                    {locatingUser ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
                  </Button>
                </div>
                {geolocationError && (
                  <p className="text-xs text-destructive flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                    {geolocationError}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-secondary-foreground font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Lightbulb size={18} className="mr-2" />
                    Suggest Reuse
                  </>
                )}
              </Button>

              {waste && quantity && (
                <p className="text-xs text-muted-foreground italic">
                  Searching for: <strong>{waste}</strong> ({quantity} kg)
                </p>
              )}
            </form>
          </Card>
        </div>

        {/* Recommendations and Map */}
        <div className="lg:col-span-2">
          {searched && loading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 size={32} className="animate-spin mb-4 text-primary" />
              <p>Finding recommendations for {waste}...</p>
            </div>
          )}

          {searched && !loading && recommendations.length === 0 && !error && (
            <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
              <p className="text-muted-foreground mb-4">No specific recommendations found for "{waste}"</p>
              <p className="text-sm text-muted-foreground">Try composting or contact a local sustainability center.</p>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="space-y-6">
              {/* Recommendations Header */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-secondary" />
                  Found {recommendations.length} way{recommendations.length !== 1 ? "s" : ""} to use{" "}
                  <strong className="text-secondary">{waste}</strong> ({quantity} kg)
                </p>

                {/* Recommendation Cards */}
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <Card
                      key={index}
                      className="p-6 border-2 border-secondary/20 hover:border-secondary/50 transition-all hover:shadow-lg"
                    >
                      <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                        <Lightbulb size={24} className="text-secondary" />
                        {rec.use_case}
                      </h3>
                      <p className="text-muted-foreground mb-4">{rec.description}</p>

                      {/* Process */}
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-foreground mb-2">Process:</p>
                        <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">{rec.process}</p>
                      </div>

                      {/* Benefits */}
                      {rec.benefits.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-2">Benefits:</p>
                          <ul className="space-y-2">
                            {rec.benefits.map((benefit, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 size={16} className="text-secondary mt-0.5 flex-shrink-0" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {industries.length > 0 && (
                <div className="border-t-2 border-muted pt-6 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                      <MapPin size={18} className="text-primary" />
                      Interactive Map - Nearby Buyers & Industries
                    </p>
                    <WasteMap location={location} industries={industries} userLocation={userLocation} />
                  </div>

                  {/* Industries List */}
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-3">Available Markets</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {industries.map((industry) => (
                        <Card
                          key={industry.id}
                          className="p-4 bg-accent/5 border border-accent/20 hover:border-accent/50 transition-all hover:shadow-md"
                        >
                          <p className="font-semibold text-foreground text-sm">{industry.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{industry.type}</p>
                          <p className="text-xs text-primary mt-1 font-medium">
                            {industry.location} ({industry.lat.toFixed(2)}, {industry.lng.toFixed(2)})
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-xs h-7 w-full hover:bg-accent/10"
                            onClick={() => {
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${industry.lat},${industry.lng}`,
                                "_blank",
                              )
                            }}
                          >
                            Get Directions
                          </Button>
                        </Card>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 italic">
                      Contact these buyers to understand current market rates and purchase requirements.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
