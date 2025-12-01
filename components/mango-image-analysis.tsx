"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Upload, Loader2, Image as ImageIcon } from "lucide-react"

interface MangoImageAnalysisProps {
  onBack: () => void
}

interface AnalysisResult {
  segmentedImage: string
  analysis: string
  confidence: number
  yield: string
  mangoCount: number
}

export default function MangoImageAnalysis({ onBack }: MangoImageAnalysisProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setError("")
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setResult(null)
    } else {
      setError("Please select a valid image file")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (dragActive) return
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch('/api/image-segmentation', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Segmentation failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const resetAnalysis = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResult(null)
    setError("")
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
      <h2 className="text-3xl font-bold text-foreground mb-2">Mango Image Analysis</h2>
      <p className="text-muted-foreground mb-8">
        Upload a mango image for AI-powered segmentation using deep learning CNN models
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div>
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer relative ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  style={{ zIndex: 20, pointerEvents: previewUrl ? 'none' : 'auto' }}
                  ref={fileInputRef}
                />
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-64 mx-auto rounded-lg object-contain"
                    />
                    <p className="text-sm text-muted-foreground">
                      {selectedFile?.name}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetAnalysis}
                      className="mt-4 relative z-10"
                    >
                      Choose Different Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <ImageIcon size={32} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground mb-2">
                        Upload Mango Image
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Drag and drop an image here, or click to browse
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer relative z-30"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (fileInputRef.current) {
                            fileInputRef.current.click()
                          }
                        }}
                      >
                        <Upload size={16} className="mr-2" />
                        Choose Image
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={!selectedFile || loading}
                className="w-full h-11 bg-gradient-to-r from-accent to-primary hover:opacity-90 text-accent-foreground font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  "Analyze Mango Image"
                )}
              </Button>
            </form>
          </Card>
        </div>

        {/* Results Section */}
        <div>
          {result && (
            <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-2 border-accent/20">
              <h3 className="text-xl font-bold text-foreground mb-4">Analysis Result</h3>

              <div className="space-y-4">
                {/* Segmented Image */}
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-2">Segmented Image</p>
                  <img
                    src={result.segmentedImage}
                    alt="Segmented mango"
                    className="w-full rounded-lg"
                  />
                </div>

                {/* Confidence */}
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Confidence Level</p>
                  <p className="text-2xl font-bold text-accent">{result.confidence.toFixed(1)}%</p>
                </div>

                {/* Mango Count */}
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Detected Mangoes</p>
                  <p className="text-2xl font-bold text-accent">{result.mangoCount}</p>
                </div>

                {/* Predicted Yield */}
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Predicted Yield (tons/ha)</p>
                  <p className="text-2xl font-bold text-accent">{parseFloat(result.yield).toFixed(3)}</p>
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
