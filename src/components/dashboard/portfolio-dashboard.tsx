"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Property, PropertyStage, Expense } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { signOut } from "next-auth/react"
import { 
  Plus, 
  Search, 
  Filter, 
  LogOut, 
  Building2, 
  LayoutGrid, 
  List,
  Loader2,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  TrendingUp
} from "lucide-react"
import { PropertyCard } from "@/components/property/property-card"
import { PropertyForm } from "@/components/property/property-form"
import { ExpensePanel } from "@/components/property/expense-panel"
import { SoldModal } from "@/components/property/sold-modal"
import { AnalyticsDashboard } from "@/components/dashboard/analytics-dashboard"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

type PropertyWithExpenses = Property & { expenses: Expense[] }

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
  stageCounts: Record<string, number>
  recentActivity: Array<{
    id: string
    fromStage: string | null
    toStage: string
    changedAt: string
    property: { address: string; parcelNumber: string }
  }>
}

export function PortfolioDashboard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  // UI State
  const [searchQuery, setSearchQuery] = useState("")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [viewingExpenses, setViewingExpenses] = useState<Property | null>(null)
  const [markingSold, setMarkingSold] = useState<Property | null>(null)
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [analyticsExpanded, setAnalyticsExpanded] = useState(true)

  // Fetch properties
  const { 
    data: properties = [], 
    isLoading: propertiesLoading,
    error: propertiesError 
  } = useQuery<PropertyWithExpenses[]>({
    queryKey: ["properties"],
    queryFn: async () => {
      const res = await fetch("/api/properties")
      if (!res.ok) throw new Error("Failed to fetch properties")
      return res.json()
    },
  })

  // Fetch analytics
  const { 
    data: analytics, 
    isLoading: analyticsLoading 
  } = useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics")
      if (!res.ok) throw new Error("Failed to fetch analytics")
      return res.json()
    },
  })

  // Fetch expenses for a property
  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["expenses", viewingExpenses?.id],
    queryFn: async () => {
      if (!viewingExpenses) return []
      const res = await fetch(`/api/expenses?propertyId=${viewingExpenses.id}`)
      if (!res.ok) throw new Error("Failed to fetch expenses")
      return res.json()
    },
    enabled: !!viewingExpenses,
  })

  // Create property mutation
  const createPropertyMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create property")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      setShowPropertyForm(false)
      toast({ title: "Property added successfully! 🎉" })
    },
    onError: () => {
      toast({ title: "Failed to add property", variant: "destructive" })
    },
  })

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/properties/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update property")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      toast({ title: "Property updated successfully" })
    },
    onError: () => {
      toast({ title: "Failed to update property", variant: "destructive" })
    },
  })

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/properties/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete property")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      setDeletingPropertyId(null)
      toast({ title: "Property deleted successfully" })
    },
    onError: () => {
      toast({ title: "Failed to delete property", variant: "destructive" })
    },
  })

  // Add expense mutation
  const addExpenseMutation = useMutation({
    mutationFn: async ({ propertyId, data }: { propertyId: string; data: Record<string, unknown> }) => {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, ...data }),
      })
      if (!res.ok) throw new Error("Failed to add expense")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] })
      queryClient.invalidateQueries({ queryKey: ["expenses", viewingExpenses?.id] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      toast({ title: "Expense added successfully" })
    },
    onError: () => {
      toast({ title: "Failed to add expense", variant: "destructive" })
    },
  })

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete expense")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] })
      queryClient.invalidateQueries({ queryKey: ["expenses", viewingExpenses?.id] })
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      toast({ title: "Expense deleted successfully" })
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" })
    },
  })

  // Handle errors
  useEffect(() => {
    if (propertiesError) {
      toast({
        title: "Session expired",
        description: "Please log in again.",
        variant: "destructive",
      })
    }
  }, [propertiesError, toast])

  // Filter properties
  const filteredProperties = properties.filter((property) => {
    const matchesSearch = 
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.parcelNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (property.priorOwner?.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStage = stageFilter === "all" || property.stage === stageFilter
    
    return matchesSearch && matchesStage
  })

  // Handlers
  const handlePropertySubmit = async (data: Record<string, unknown>) => {
    if (editingProperty) {
      await updatePropertyMutation.mutateAsync({ id: editingProperty.id, data })
      setEditingProperty(null)
    } else {
      await createPropertyMutation.mutateAsync(data)
    }
  }

  const handleStageChange = async (id: string, stage: PropertyStage) => {
    await updatePropertyMutation.mutateAsync({ id, data: { stage } })
  }

  const handleMarkSold = async (data: Record<string, unknown>) => {
    if (!markingSold) return
    await updatePropertyMutation.mutateAsync({ 
      id: markingSold.id, 
      data: { 
        stage: "SOLD",
        soldAmount: data.soldAmount,
        soldDate: data.soldDate,
      } 
    })
    setMarkingSold(null)
  }

  const handleAddExpense = async (data: Record<string, unknown>) => {
    if (!viewingExpenses) return
    await addExpenseMutation.mutateAsync({ propertyId: viewingExpenses.id, data })
  }

  const handleDeleteExpense = async (id: string) => {
    await deleteExpenseMutation.mutateAsync(id)
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Tax Lien Portfolio</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {properties.length} properties tracked
                </p>
              </div>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden pt-3 pb-1 border-t mt-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  signOut({ callbackUrl: "/" })
                  setShowMobileMenu(false)
                }}
                className="w-full justify-start text-muted-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Analytics Section - Collapsible */}
        <Collapsible open={analyticsExpanded} onOpenChange={setAnalyticsExpanded} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="font-medium">Portfolio Analytics</span>
                {analyticsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <AnalyticsDashboard data={analytics} isLoading={analyticsLoading} />
          </CollapsibleContent>
        </Collapsible>

        {/* Properties Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Properties</h2>
              <p className="text-sm text-muted-foreground">
                {filteredProperties.length} of {properties.length} properties
              </p>
            </div>
            <Button onClick={() => setShowPropertyForm(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 p-4 bg-background rounded-xl border shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address, parcel, or owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="PURCHASED">Purchased</SelectItem>
                <SelectItem value="RR_FORECLOSED">RR Foreclosed</SelectItem>
                <SelectItem value="QUIET_TITLED">Quiet Titled</SelectItem>
                <SelectItem value="FOR_SALE">For Sale</SelectItem>
                <SelectItem value="SOLD">Sold</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Properties List */}
          {propertiesLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Loading properties...</p>
              </div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
              <div className="p-4 rounded-full bg-muted w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                {properties.length === 0 ? "No properties yet" : "No matching properties"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                {properties.length === 0 
                  ? "Start tracking your tax lien investments by adding your first property."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {properties.length === 0 && (
                <Button onClick={() => setShowPropertyForm(true)} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Property
                </Button>
              )}
            </div>
          ) : (
            <div className={cn(
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" 
                : "space-y-3"
            )}>
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onStageChange={handleStageChange}
                  onEdit={(p) => {
                    setEditingProperty(p)
                    setShowPropertyForm(true)
                  }}
                  onDelete={(id) => setDeletingPropertyId(id)}
                  onViewExpenses={(p) => setViewingExpenses(p)}
                  onMarkSold={(p) => setMarkingSold(p)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t py-4 mt-auto">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Tax Lien Portfolio Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{properties.length} properties</span>
            <span>•</span>
            <span>{analytics?.soldProperties || 0} sold</span>
          </div>
        </div>
      </footer>

      {/* Modals & Panels */}
      <PropertyForm
        open={showPropertyForm}
        onOpenChange={(open) => {
          setShowPropertyForm(open)
          if (!open) setEditingProperty(null)
        }}
        property={editingProperty}
        onSubmit={handlePropertySubmit}
        isLoading={createPropertyMutation.isPending || updatePropertyMutation.isPending}
      />

      <ExpensePanel
        open={!!viewingExpenses}
        onOpenChange={(open) => {
          if (!open) setViewingExpenses(null)
        }}
        property={viewingExpenses}
        expenses={expenses}
        onAddExpense={handleAddExpense}
        onDeleteExpense={handleDeleteExpense}
        isLoading={addExpenseMutation.isPending}
      />

      <SoldModal
        open={!!markingSold}
        onOpenChange={(open) => {
          if (!open) setMarkingSold(null)
        }}
        property={markingSold}
        onConfirm={handleMarkSold}
        isLoading={updatePropertyMutation.isPending}
      />

      <AlertDialog open={!!deletingPropertyId} onOpenChange={() => setDeletingPropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This will also delete all associated expenses and history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingPropertyId) {
                  deletePropertyMutation.mutate(deletingPropertyId)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
