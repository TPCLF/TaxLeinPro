import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

// GET analytics for the current user
export async function GET() {
  try {
    const user = await requireAuth()
    
    const properties = await db.property.findMany({
      where: { userId: user.id },
      include: {
        expenses: true,
        stageHistory: true,
      },
    })
    
    // Calculate analytics
    const soldProperties = properties.filter(p => p.stage === "SOLD")
    const activeProperties = properties.filter(p => p.stage !== "SOLD")
    
    // Total earnings from sold properties
    const totalEarnings = soldProperties.reduce((sum, p) => sum + (p.soldAmount || 0), 0)
    
    // Total investment (bid amounts)
    const totalInvestment = properties.reduce((sum, p) => sum + p.bidAmount, 0)
    
    // Total expenses
    const totalExpenses = properties.reduce((sum, p) => {
      return sum + p.expenses.reduce((expSum, e) => expSum + e.amount, 0)
    }, 0)
    
    // Total cost (investment + expenses)
    const totalCost = totalInvestment + totalExpenses
    
    // Net profit
    const netProfit = totalEarnings - totalCost
    
    // ROI percentage
    const roi = totalCost > 0 ? ((netProfit / totalCost) * 100) : 0
    
    // Average hold time for sold properties
    const holdTimes = soldProperties.map(p => {
      const soldDate = p.soldDate || new Date()
      const purchaseDate = p.purchaseDate
      return (soldDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24) // days
    })
    const avgHoldTime = holdTimes.length > 0 
      ? holdTimes.reduce((sum, t) => sum + t, 0) / holdTimes.length 
      : 0
    
    // Average cost to acquire (bid + expenses before sale)
    const avgCostToAcquire = properties.length > 0 
      ? totalCost / properties.length 
      : 0
    
    // Average return per sold property
    const avgReturn = soldProperties.length > 0 
      ? totalEarnings / soldProperties.length 
      : 0
    
    // Portfolio value (current value of active properties)
    const portfolioValue = activeProperties.reduce((sum, p) => sum + p.currentValue, 0)
    
    // Stats by stage
    const stageCounts = {
      PURCHASED: properties.filter(p => p.stage === "PURCHASED").length,
      RR_FORECLOSED: properties.filter(p => p.stage === "RR_FORECLOSED").length,
      QUIET_TITLED: properties.filter(p => p.stage === "QUIET_TITLED").length,
      FOR_SALE: properties.filter(p => p.stage === "FOR_SALE").length,
      SOLD: soldProperties.length,
    }
    
    // Recent activity (last 10 stage changes)
    const recentActivity = await db.stageHistory.findMany({
      where: {
        property: { userId: user.id },
      },
      include: {
        property: {
          select: {
            address: true,
            parcelNumber: true,
          },
        },
      },
      orderBy: { changedAt: "desc" },
      take: 10,
    })
    
    return NextResponse.json({
      totalProperties: properties.length,
      activeProperties: activeProperties.length,
      soldProperties: soldProperties.length,
      totalInvestment,
      totalExpenses,
      totalCost,
      totalEarnings,
      netProfit,
      roi,
      avgHoldTime,
      avgCostToAcquire,
      avgReturn,
      portfolioValue,
      stageCounts,
      recentActivity,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
