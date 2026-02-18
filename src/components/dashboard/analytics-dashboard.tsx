"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Building2,
  BarChart3,
  PieChart,
  Activity,
  Minus,
  Wallet,
  Receipt,
  Percent
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface SoldPropertyMetric {
  id: string
  salePrice: number
  costBasis: number
  profit: number
  holdTimeDays: number
  bidAmount: number
  expensesTotal: number
}

interface AnalyticsData {
  totalProperties: number
  activeProperties: number
  soldProperties: number
  totalInvestment: number
  totalExpenses: number
  portfolioValue: number
  totalEarnings: number
  totalCostSold: number
  netProfit: number
  roi: number
  avgHoldTime: number
  avgReturn: number
  avgProfit: number
  stageCounts: {
    PURCHASED: number
    RR_FORECLOSED: number
    QUIET_TITLED: number
    FOR_SALE: number
    SOLD: number
  }
  recentActivity: Array<{
    id: string
    fromStage: string | null
    toStage: string
    changedAt: string
    property: {
      address: string
      parcelNumber: string
    }
  }>
  soldPropertyMetrics?: SoldPropertyMetric[]
}

interface AnalyticsDashboardProps {
  data: AnalyticsData | null
  isLoading?: boolean
}

const STAGE_LABELS: Record<string, string> = {
  PURCHASED: "Purchased",
  RR_FORECLOSED: "RR Foreclosed",
  QUIET_TITLED: "Quiet Titled",
  FOR_SALE: "For Sale",
  SOLD: "Sold",
}

const STAGE_COLORS: Record<string, string> = {
  PURCHASED: "bg-slate-500",
  RR_FORECLOSED: "bg-amber-500",
  QUIET_TITLED: "bg-emerald-500",
  FOR_SALE: "bg-sky-500",
  SOLD: "bg-violet-500",
}

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  className 
}: { 
  title: string
  value: string
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
  trend?: "up" | "down" | "neutral"
  className?: string
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {Icon && (
              <div className="p-2 rounded-full bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            {trend !== undefined && (
              <div className={cn(
                "p-1 rounded-full",
                trend === "up" && "bg-emerald-100 dark:bg-emerald-900",
                trend === "down" && "bg-red-100 dark:bg-red-900",
                trend === "neutral" && "bg-muted"
              )}>
                {trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
                {trend === "down" && <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
                {trend === "neutral" && <Minus className="h-4 w-4 text-muted-foreground" />}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsDashboard({ data, isLoading }: AnalyticsDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-8 bg-muted rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const getTrend = (value: number): "up" | "down" | "neutral" => {
    if (value > 0) return "up"
    if (value < 0) return "down"
    return "neutral"
  }

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const formatDays = (days: number) => {
    if (days < 30) return `${Math.round(days)} days`
    if (days < 365) return `${Math.round(days / 30)} months`
    return `${(days / 365).toFixed(1)} years`
  }

  return (
    <div className="space-y-4">
      {/* Key Performance Metrics - Sold Properties */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Performance (Sold Properties)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            title="Net Profit"
            value={`${data.netProfit >= 0 ? '+' : ''}${formatCurrency(data.netProfit)}`}
            subtitle={data.soldProperties > 0 ? `${data.soldProperties} properties sold` : "No sales yet"}
            icon={DollarSign}
            trend={getTrend(data.netProfit)}
            className={data.netProfit >= 0 ? "border-emerald-200 dark:border-emerald-800" : "border-red-200 dark:border-red-800"}
          />
          <StatCard
            title="ROI"
            value={formatPercent(data.roi)}
            subtitle={data.totalCostSold > 0 ? `On ${formatCurrency(data.totalCostSold)} invested` : "No investment returned"}
            icon={Percent}
            trend={getTrend(data.roi)}
          />
          <StatCard
            title="Avg Hold Time"
            value={formatDays(data.avgHoldTime)}
            subtitle={data.soldProperties > 0 ? "Average time to sell" : "No sales yet"}
            icon={Calendar}
          />
          <StatCard
            title="Avg Return"
            value={formatCurrency(data.avgReturn)}
            subtitle={data.soldProperties > 0 ? "Per property sold" : "No sales yet"}
            icon={BarChart3}
          />
        </div>
      </div>

      {/* Portfolio Overview - All Properties */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Portfolio Overview (All Properties)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            title="Total Invested"
            value={formatCurrency(data.totalInvestment)}
            subtitle="All bid amounts"
            icon={Wallet}
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(data.totalExpenses)}
            subtitle="All recorded expenses"
            icon={Receipt}
          />
          <StatCard
            title="Portfolio Value"
            value={formatCurrency(data.portfolioValue)}
            subtitle={`${data.activeProperties} active properties`}
            icon={Building2}
          />
          <StatCard
            title="Total Earnings"
            value={formatCurrency(data.totalEarnings)}
            subtitle="From sold properties"
            icon={DollarSign}
          />
        </div>
      </div>

      {/* Stage Distribution & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stage Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Properties by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.stageCounts).map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", STAGE_COLORS[stage])} />
                    <span className="text-sm">{STAGE_LABELS[stage]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{count}</Badge>
                    {data.totalProperties > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {((count / data.totalProperties) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[180px]">
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className={cn("w-2 h-2 mt-1.5 rounded-full flex-shrink-0", STAGE_COLORS[activity.toStage])} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.property.address}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.fromStage 
                            ? `${STAGE_LABELS[activity.fromStage]} → ${STAGE_LABELS[activity.toStage]}`
                            : `Added as ${STAGE_LABELS[activity.toStage]}`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.changedAt), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Sold Properties Detail */}
      {data.soldPropertyMetrics && data.soldPropertyMetrics.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Sold Properties Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Sale Price</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Cost Basis</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Profit/Loss</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Hold Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.soldPropertyMetrics.map((metric) => (
                    <tr key={metric.id} className="border-b last:border-0">
                      <td className="py-2 px-2">{formatCurrency(metric.salePrice)}</td>
                      <td className="py-2 px-2">{formatCurrency(metric.costBasis)}</td>
                      <td className={cn(
                        "py-2 px-2 font-medium",
                        metric.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {metric.profit >= 0 ? '+' : ''}{formatCurrency(metric.profit)}
                      </td>
                      <td className="py-2 px-2">{formatDays(metric.holdTimeDays)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
