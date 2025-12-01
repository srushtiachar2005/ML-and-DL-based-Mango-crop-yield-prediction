"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import YieldPrediction from "@/components/yield-prediction"
import WasteRecommendation from "@/components/waste-recommendation"
import ImageYieldPrediction from "@/components/image-yield-prediction"


interface DashboardProps {
  user: { name: string; email: string }
  onLogout: () => void
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentPage, setCurrentPage] = useState<"home" | "yield" | "waste" | "image-yield">("home")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">F</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Farm2Value</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button onClick={onLogout} variant="outline" size="sm" className="text-foreground bg-transparent">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentPage === "home" && (
          <div>
            {/* Welcome Section */}
            <div className="mb-12">
              <h2 className="text-4xl font-bold text-foreground mb-3">Welcome back, {user.name}!</h2>
              <p className="text-lg text-muted-foreground">
                Choose a feature to get started with AI-powered agricultural insights
              </p>
            </div>



            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Yield Prediction Card */}
              <Card
                className="border-2 border-border hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
                onClick={() => setCurrentPage("yield")}
              >
                <div className="p-8">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4">
                    <span className="text-3xl">🌾</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Yield Prediction</h3>
                  <p className="text-muted-foreground mb-6">
                    Predict mango yield based on weather conditions, region, and farming parameters using advanced AI
                    models.
                  </p>
                  <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground">
                    Predict Yield
                  </Button>
                </div>
              </Card>

              {/* Image Based Yield Prediction Card */}
              <Card
                className="border-2 border-border hover:border-accent/50 transition-all cursor-pointer overflow-hidden"
                onClick={() => setCurrentPage("image-yield")}
              >
                <div className="p-8">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center mb-4">
                    <span className="text-3xl">📷</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Image Based Yield Prediction</h3>
                  <p className="text-muted-foreground mb-6">
                    Upload mango images for AI-powered yield prediction using computer vision and deep learning models.
                  </p>
                  <Button className="bg-gradient-to-r from-accent to-primary hover:opacity-90 text-accent-foreground">
                    Predict from Image
                  </Button>
                </div>
              </Card>

              {/* Waste Recommendation Card */}
              <Card
                className="border-2 border-border hover:border-secondary/50 transition-all cursor-pointer overflow-hidden"
                onClick={() => setCurrentPage("waste")}
              >
                <div className="p-8">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center mb-4">
                    <span className="text-3xl">♻️</span>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Waste Recommendations</h3>
                  <p className="text-muted-foreground mb-6">
                    Get sustainable ways to reuse and repurpose agricultural waste and byproducts.
                  </p>
                  <Button className="bg-gradient-to-r from-secondary to-accent hover:opacity-90 text-secondary-foreground">
                    Find Solutions
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {currentPage === "yield" && <YieldPrediction onBack={() => setCurrentPage("home")} />}

        {currentPage === "image-yield" && <ImageYieldPrediction onBack={() => setCurrentPage("home")} />}

        {currentPage === "waste" && <WasteRecommendation onBack={() => setCurrentPage("home")} />}
      </main>
    </div>
  )
}
