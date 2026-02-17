import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// UPDATE an expense
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    
    const expense = await db.expense.findUnique({
      where: { id },
      include: { property: true },
    })
    
    if (!expense || expense.property.userId !== user.id) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }
    
    const { category, description, amount, date } = body
    
    const updatedExpense = await db.expense.update({
      where: { id },
      data: {
        category: category || expense.category,
        description: description || expense.description,
        amount: amount !== undefined ? parseFloat(amount) : expense.amount,
        date: date ? new Date(date) : expense.date,
      },
    })
    
    return NextResponse.json(updatedExpense)
  } catch (error) {
    console.error("Error updating expense:", error)
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 })
  }
}

// DELETE an expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    
    const expense = await db.expense.findUnique({
      where: { id },
      include: { property: true },
    })
    
    if (!expense || expense.property.userId !== user.id) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }
    
    await db.expense.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
  }
}
