import { type NextRequest, NextResponse } from "next/server"

const wasteDatabase: Record<string, any> = {
  "mango peel": {
    use_case: "Convert into compost or animal feed",
    description: "Mango peels are nutrient-rich and can be processed into high-quality compost or dried feed.",
    benefits: [
      "Nutrient-rich soil amendment",
      "Animal feed ingredient",
      "Composting compatible",
      "Cost-effective waste reduction",
    ],
    process:
      "Collect peels, chop into small pieces, layer with other organic matter, maintain moisture, turn weekly, ready in 30-45 days",
  },
  "mango seed": {
    use_case: "Extract seed oil or powder for cosmetic use",
    description: "Mango seeds contain valuable oils and compounds used in cosmetics and traditional medicine.",
    benefits: ["High market value", "Cosmetic applications", "Medicinal properties", "Export potential"],
    process: "Dry seeds in shade for 1-2 weeks, crack shells, extract kernels, cold-press for oil or grind for powder",
  },
  "mango husk": {
    use_case: "Use for biomass fuel or organic manure",
    description: "Dried mango husks can be used as an energy source or incorporated into soil amendments.",
    benefits: ["Renewable energy source", "Organic matter addition", "Waste reduction", "Revenue generation"],
    process: "Dry husks completely, chop into uniform size, use for burning or incorporate into compost",
  },
  "sugarcane bagasse": {
    use_case: "Use for paper or bioethanol production",
    description: "Sugarcane bagasse is a valuable byproduct that can be converted into paper pulp or biofuel.",
    benefits: ["Biofuel production", "Paper industry feedstock", "Renewable energy", "Industrial market value"],
    process:
      "Collect after sugar extraction, dry to 20% moisture, process through pulping or fermentation for bioethanol",
  },
  "paddy straw": {
    use_case: "Use in mushroom cultivation or bio-compressed bricks",
    description:
      "Paddy straw serves as an excellent growing medium for mushrooms or raw material for compressed bricks.",
    benefits: [
      "Mushroom farming substrate",
      "Building material production",
      "Farmer income increase",
      "Sustainable waste utilization",
    ],
    process: "Collect straw, chop into 2-3 inch pieces, sterilize for mushroom cultivation or compress for bricks",
  },
  "corn husk": {
    use_case: "Use for handicrafts or organic compost",
    description: "Corn husks can be used creatively for handicrafts or decomposed for soil enrichment.",
    benefits: ["Handicraft material", "Composting ingredient", "Artisanal product value", "Waste elimination"],
    process: "Dry husks thoroughly, use for weaving crafts or compost with other organic materials for 45-60 days",
  },
  "mango leaves": {
    use_case: "Organic compost and herbal tea",
    description: "Rich in nutrients, mango leaves create excellent compost or can be dried for herbal beverages.",
    benefits: ["Soil fertility", "Health product potential", "High demand tea", "Complete waste utilization"],
    process: "Collect fresh leaves, dry in shade for 2-3 weeks, compost with other materials or package for tea",
  },
  "mango branches": {
    use_case: "Biomass energy or mulch material",
    description: "Pruned branches can be converted to energy through biomass or shredded for mulching.",
    benefits: ["Energy generation", "Mulch production", "Weed control", "Moisture retention"],
    process: "Dry branches for 2-3 weeks, chip into pieces for biomass or shred for mulch application",
  },
  "orchard trimmings": {
    use_case: "Mulch material for moisture retention",
    description: "General orchard waste makes excellent mulch for moisture conservation and weed suppression.",
    benefits: ["Reduces water loss", "Weed prevention", "Soil improvement", "Free mulch source"],
    process: "Collect all trimmings, shred using a mulcher, apply 2-3 inch layer around plants",
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { waste, quantity, location } = body

    if (!waste || typeof waste !== "string") {
      return NextResponse.json({ error: "Waste type is required" }, { status: 400 })
    }

    const normalizedWaste = waste.toLowerCase().trim()

    // Search for exact match
    const recommendations = []

    if (wasteDatabase[normalizedWaste]) {
      recommendations.push(wasteDatabase[normalizedWaste])
    } else {
      // Try partial matches
      for (const [key, value] of Object.entries(wasteDatabase)) {
        if (normalizedWaste.includes(key) || key.includes(normalizedWaste)) {
          recommendations.push(value)
          if (recommendations.length >= 3) break
        }
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        use_case: "Consult local waste collection or compost centers",
        description: "No direct match found for this waste type. Consider local resources.",
        benefits: [
          "Local expertise available",
          "Community support",
          "Waste management guidance",
          "Sustainability partnership",
        ],
        process: "Contact local agricultural extension office or waste management authorities for specific guidance",
      })
    }

    return NextResponse.json({ recommendations: recommendations.slice(0, 3) })
  } catch (error) {
    console.error("Waste recommendation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
