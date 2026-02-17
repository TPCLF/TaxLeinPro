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
  Minus
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface AnalyticsData {
  totalProperties: number
  activeProperties: number
  soldProperties: number
  totalInvestment: number
  totalExpenses: number
  totalCost: number
  totalEarnings: number
  netProfit: number
  roi: number
  avgHoldTime: number
  avgCostToAcquire: number
  avgReturn: number
  portfolioValue: number
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

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Net Profit"
          value={`${data.netProfit >= 0 ? "+" : ""}$${data.netProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          subtitle="Total earnings minus costs"
          icon={DollarSign}
          trend={getTrend(data.netProfit)}
        />
        <StatCard
          title="ROI"
          value={`${data.roi.toFixed(1)}%`}
          subtitle="Return on investment"
          icon={BarChart3}
          trend={getTrend(data.roi)}
        />
        <StatCard
          title="Avg Hold Time"
          value={`${Math.round(data.avgHoldTime)} days`}
          subtitle="For sold properties"
          icon={Calendar}
        />
        <StatCard
          title="Portfolio Value"
          value={`$${data.portfolioValue.toLocaleString()}`}
          subtitle={`${data.activeProperties} active properties`}
          icon={Building2}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Total Invested"
          value={`$${data.totalInvestment.toLocaleString()}`}
          subtitle="Bid amounts only"
        />
        <StatCard
          title="Total Expenses"
          value={`$${data.totalExpenses.toLocaleString()}`}
          subtitle="All recorded expenses"
        />
        <StatCard
          title="Total Earnings"
          value={`$${data.totalEarnings.toLocaleString()}`}
          subtitle="From sold properties"
        />
        <StatCard
          title="Avg Return"
          value={`$${data.avgReturn.toLocaleString()}`}
          subtitle="Per sold property"
        />
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
                      <div className={cn("w-2 h-2 mt-1.5 rounded-full", STAGE_COLORS[activity.toStage])} />
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
    </div>
  )
}
