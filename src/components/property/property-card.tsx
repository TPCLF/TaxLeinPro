"use client"

import { Property, PropertyStage } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StageTracker } from "./stage-tracker"
import { cn } from "@/lib/utils"
import { 
  MapPin, 
  Calendar, 
  FileText, 
  Building2,
  MoreVertical,
  Pencil,
  Trash2,
  TrendingUp,
  Receipt
} from "lucide-react"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  LAND: "Land",
  INDUSTRIAL: "Industrial",
  AGRICULTURAL: "Agricultural",
  OTHER: "Other",
}

const STAGE_CONFIG: Record<PropertyStage, { label: string; className: string }> = {
  PURCHASED: { label: "Purchased", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  RR_FORECLOSED: { label: "RR Foreclosed", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" },
  QUIET_TITLED: { label: "Quiet Titled", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  FOR_SALE: { label: "For Sale", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300" },
  SOLD: { label: "Sold", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300" },
}

interface PropertyCardProps {
  property: Property & { expenses: { amount: number }[] }
  onStageChange: (id: string, stage: PropertyStage) => void
  onEdit: (property: Property) => void
  onDelete: (id: string) => void
  onViewExpenses: (property: Property) => void
  onMarkSold: (property: Property) => void
}

export function PropertyCard({
  property,
  onStageChange,
  onEdit,
  onDelete,
  onViewExpenses,
  onMarkSold,
}: PropertyCardProps) {
  const totalExpenses = property.expenses.reduce((sum, e) => sum + e.amount, 0)
  const totalInvestment = property.bidAmount + totalExpenses
  const profit = property.stage === "SOLD" && property.soldAmount 
    ? property.soldAmount - totalInvestment 
    : null

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-card">
      <CardHeader className="pb-3 bg-gradient-to-r from-muted/50 to-muted/30">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <span className="truncate">{property.address}</span>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={STAGE_CONFIG[property.stage].className}>
                {STAGE_CONFIG[property.stage].label}
              </Badge>
              <Badge variant="outline" className="text-xs font-normal">
                {PROPERTY_TYPE_LABELS[property.propertyType]}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit(property)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Property
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewExpenses(property)}>
                <Receipt className="h-4 w-4 mr-2" />
                Manage Expenses
              </DropdownMenuItem>
              {property.stage !== "SOLD" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onMarkSold(property)}>
                    <TrendingUp className="h-4 w-4 mr-2 text-emerald-500" />
                    Mark as Sold
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(property.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Stage Tracker */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-xs font-medium text-muted-foreground mb-2">Property Stage</p>
          <StageTracker
            currentStage={property.stage}
            onStageChange={(stage) => onStageChange(property.id, stage)}
          />
        </div>
        
        {/* Property Info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span className="truncate">{property.parcelNumber}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span className="truncate">{property.priorOwner || "Unknown"}</span>
          </div>
        </div>
        
        {/* Financial Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Bid Amount</p>
            <p className="font-semibold text-sm">${property.bidAmount.toLocaleString()}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Current Value</p>
            <p className="font-semibold text-sm">${property.currentValue.toLocaleString()}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Expenses</p>
            <p className={cn("font-semibold text-sm", totalExpenses > 0 ? "text-amber-600 dark:text-amber-400" : "")}>
              ${totalExpenses.toLocaleString()}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Invested</p>
            <p className="font-semibold text-sm">${totalInvestment.toLocaleString()}</p>
          </div>
        </div>
        
        {/* Asking Price (if for sale) */}
        {property.askingPrice && property.stage === "FOR_SALE" && (
          <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Asking Price</p>
                <p className="text-lg font-bold text-sky-700 dark:text-sky-300">
                  ${property.askingPrice.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-sky-500" />
            </div>
          </div>
        )}
        
        {/* Sold Info */}
        {property.stage === "SOLD" && property.soldAmount && (
          <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">Sold For</p>
                <p className="text-lg font-bold text-violet-700 dark:text-violet-300">
                  ${property.soldAmount.toLocaleString()}
                </p>
              </div>
              {profit !== null && (
                <div className={cn(
                  "text-right",
                  profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  <p className="text-xs font-medium">Profit/Loss</p>
                  <p className="font-bold">
                    {profit >= 0 ? "+" : ""}${profit.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            {property.soldDate && (
              <p className="text-xs text-violet-500 dark:text-violet-400">
                Sold on {format(new Date(property.soldDate), "MMM d, yyyy")}
              </p>
            )}
          </div>
        )}
        
        {/* Purchase Date */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Calendar className="h-3 w-3" />
          <span>Purchased {format(new Date(property.purchaseDate), "MMM d, yyyy")}</span>
        </div>
      </CardContent>
    </Card>
  )
}
