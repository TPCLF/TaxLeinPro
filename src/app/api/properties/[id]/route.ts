import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// GET a single property
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    
    const property = await db.property.findFirst({
      where: { id, userId: user.id },
      include: {
        expenses: true,
        stageHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    })
    
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }
    
    return NextResponse.json(property)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// UPDATE a property
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    
    const existingProperty = await db.property.findFirst({
      where: { id, userId: user.id },
    })
    
    if (!existingProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }
    
    const {
      parcelNumber,
      address,
      priorOwner,
      propertyType,
      bidAmount,
      currentValue,
      askingPrice,
      stage,
      soldAmount,
      soldDate,
      purchaseDate,
    } = body
    
    // If stage changed, record in history
    if (stage && stage !== existingProperty.stage) {
      await db.stageHistory.create({
        data: {
          propertyId: id,
          fromStage: existingProperty.stage,
          toStage: stage,
        },
      })
    }
    
    const updateData: Record<string, unknown> = {}
    if (parcelNumber !== undefined) updateData.parcelNumber = parcelNumber
    if (address !== undefined) updateData.address = address
    if (priorOwner !== undefined) updateData.priorOwner = priorOwner
    if (propertyType !== undefined) updateData.propertyType = propertyType
    if (bidAmount !== undefined) updateData.bidAmount = parseFloat(bidAmount) || 0
    if (currentValue !== undefined) updateData.currentValue = parseFloat(currentValue) || 0
    if (askingPrice !== undefined) updateData.askingPrice = askingPrice ? parseFloat(askingPrice) : null
    if (stage !== undefined) updateData.stage = stage
    if (soldAmount !== undefined) updateData.soldAmount = soldAmount ? parseFloat(soldAmount) : null
    if (soldDate !== undefined) updateData.soldDate = soldDate ? new Date(soldDate) : null
    if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate)
    
    const property = await db.property.update({
      where: { id },
      data: updateData,
      include: {
        expenses: true,
        stageHistory: {
          orderBy: { changedAt: "desc" },
        },
      },
    })
    
    return NextResponse.json(property)
  } catch (error) {
    console.error("Error updating property:", error)
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 })
  }
}

// DELETE a property
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    
    const existingProperty = await db.property.findFirst({
      where: { id, userId: user.id },
    })
    
    if (!existingProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }
    
    await db.property.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting property:", error)
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 })
  }
}
