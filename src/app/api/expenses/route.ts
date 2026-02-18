import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// GET all expenses for a property
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get("propertyId")
    
    if (!propertyId) {
      return NextResponse.json({ error: "Property ID required" }, { status: 400 })
    }
    
    // Verify property belongs to user
    const property = await db.property.findFirst({
      where: { id: propertyId, userId: user.id },
    })
    
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }
    
    const expenses = await db.expense.findMany({
      where: { propertyId },
      orderBy: { date: "desc" },
    })
    
    return NextResponse.json(expenses)
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// CREATE a new expense
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    
    const { propertyId, category, description, amount, date } = body
    
    // Verify property belongs to user
    const property = await db.property.findFirst({
      where: { id: propertyId, userId: user.id },
    })
    
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }
    
    const expense = await db.expense.create({
      data: {
        propertyId,
        category: category || "OTHER",
        description,
        amount: parseFloat(amount) || 0,
        date: date ? new Date(date) : new Date(),
      },
    })
    
    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error creating expense:", error)
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}
