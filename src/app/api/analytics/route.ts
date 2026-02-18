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
    
    // Separate sold and active properties
    const soldProperties = properties.filter(p => p.stage === "SOLD")
    const activeProperties = properties.filter(p => p.stage !== "SOLD")
    
    // ============================================
    // PORTFOLIO OVERVIEW (All Properties)
    // ============================================
    
    // Total invested across all properties (bid amounts)
    const totalInvestedAll = properties.reduce((sum, p) => sum + p.bidAmount, 0)
    
    // Total expenses across all properties
    const totalExpensesAll = properties.reduce((sum, p) => {
      return sum + p.expenses.reduce((expSum, e) => expSum + e.amount, 0)
    }, 0)
    
    // Portfolio value = current value of ACTIVE properties only
    const portfolioValue = activeProperties.reduce((sum, p) => sum + p.currentValue, 0)
    
    // ============================================
    // PERFORMANCE METRICS (Sold Properties Only)
    // ============================================
    
    // Calculate per-sold-property metrics
    const soldPropertyMetrics = soldProperties.map(p => {
      const expensesTotal = p.expenses.reduce((sum, e) => sum + e.amount, 0)
      const costBasis = p.bidAmount + expensesTotal // What we paid + expenses
      const salePrice = p.soldAmount || 0
      const profit = salePrice - costBasis
      
      // Hold time in days (only for sold properties)
      const soldDate = p.soldDate || new Date()
      const purchaseDate = p.purchaseDate
      const holdTimeDays = (soldDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
      
      return {
        id: p.id,
        salePrice,
        costBasis,
        profit,
        holdTimeDays,
        bidAmount: p.bidAmount,
        expensesTotal,
      }
    })
    
    // Total earnings = sum of all sale prices
    const totalEarnings = soldPropertyMetrics.reduce((sum, m) => sum + m.salePrice, 0)
    
    // Total cost of SOLD properties (bid amounts + expenses for sold properties)
    const totalCostSold = soldPropertyMetrics.reduce((sum, m) => sum + m.costBasis, 0)
    
    // Net profit = total earnings - total cost of sold properties
    const netProfit = totalEarnings - totalCostSold
    
    // ROI = net profit / total cost of sold properties (percentage)
    const roi = totalCostSold > 0 ? ((netProfit / totalCostSold) * 100) : 0
    
    // Average hold time = ONLY for sold properties
    const avgHoldTime = soldPropertyMetrics.length > 0 
      ? soldPropertyMetrics.reduce((sum, m) => sum + m.holdTimeDays, 0) / soldPropertyMetrics.length 
      : 0
    
    // Average return per sold property
    const avgReturn = soldProperties.length > 0 
      ? totalEarnings / soldProperties.length 
      : 0
    
    // Average profit per sold property
    const avgProfit = soldProperties.length > 0 
      ? netProfit / soldProperties.length 
      : 0
    
    // ============================================
    // STAGE DISTRIBUTION
    // ============================================
    
    const stageCounts = {
      PURCHASED: properties.filter(p => p.stage === "PURCHASED").length,
      RR_FORECLOSED: properties.filter(p => p.stage === "RR_FORECLOSED").length,
      QUIET_TITLED: properties.filter(p => p.stage === "QUIET_TITLED").length,
      FOR_SALE: properties.filter(p => p.stage === "FOR_SALE").length,
      SOLD: soldProperties.length,
    }
    
    // ============================================
    // RECENT ACTIVITY
    // ============================================
    
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
      // Counts
      totalProperties: properties.length,
      activeProperties: activeProperties.length,
      soldProperties: soldProperties.length,
      
      // Portfolio Overview (all properties)
      totalInvestment: totalInvestedAll,
      totalExpenses: totalExpensesAll,
      portfolioValue,
      
      // Performance Metrics (sold properties only)
      totalEarnings,
      totalCostSold,
      netProfit,
      roi,
      avgHoldTime,
      avgReturn,
      avgProfit,
      
      // Stage distribution
      stageCounts,
      
      // Recent activity
      recentActivity,
      
      // Individual sold property metrics (for detailed view)
      soldPropertyMetrics,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
