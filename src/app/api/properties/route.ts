import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// GET all properties for the current user
export async function GET() {
  try {
    const user = await requireAuth()
    
    const properties = await db.property.findMany({
      where: { userId: user.id },
      include: {
        expenses: true,
        stageHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    
    return NextResponse.json(properties)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// CREATE a new property
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const {
      parcelNumber,
      address,
      priorOwner,
      propertyType,
      bidAmount,
      currentValue,
      askingPrice,
      purchaseDate,
    } = body
    
    const property = await db.property.create({
      data: {
        userId: user.id,
        parcelNumber,
        address,
        priorOwner,
        propertyType: propertyType || "RESIDENTIAL",
        bidAmount: parseFloat(bidAmount) || 0,
        currentValue: parseFloat(currentValue) || 0,
        askingPrice: askingPrice ? parseFloat(askingPrice) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      },
      include: {
        expenses: true,
      },
    })
    
    // Create initial stage history
    await db.stageHistory.create({
      data: {
        propertyId: property.id,
        toStage: "PURCHASED",
      },
    })
    
    return NextResponse.json(property)
  } catch (error) {
    console.error("Error creating property:", error)
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 })
  }
}
