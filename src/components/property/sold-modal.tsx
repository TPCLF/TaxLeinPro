"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Property } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { DollarSign, Calendar, TrendingUp, Receipt, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const soldSchema = z.object({
  soldAmount: z.string().min(1, "Sale amount is required"),
  soldDate: z.string().min(1, "Sale date is required"),
})

type SoldFormData = z.infer<typeof soldSchema>

interface SoldModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: (Property & { expenses?: { amount: number }[] }) | null
  onConfirm: (data: SoldFormData) => Promise<void>
  isLoading?: boolean
}

export function SoldModal({ open, onOpenChange, property, onConfirm, isLoading }: SoldModalProps) {
  const totalExpenses = property?.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0
  const costBasis = (property?.bidAmount || 0) + totalExpenses

  const form = useForm<SoldFormData>({
    resolver: zodResolver(soldSchema),
    defaultValues: {
      soldAmount: property?.soldAmount?.toString() || "",
      soldDate: property?.soldDate 
        ? new Date(property.soldDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
  })

  // Watch the soldAmount to calculate live profit
  const watchedSoldAmount = form.watch("soldAmount")
  const soldAmount = parseFloat(watchedSoldAmount) || 0
  const estimatedProfit = soldAmount - costBasis
  const roi = costBasis > 0 ? ((estimatedProfit / costBasis) * 100) : 0

  const handleSubmit = async (data: SoldFormData) => {
    await onConfirm(data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900">
              <TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            Mark Property as Sold
          </DialogTitle>
          <DialogDescription>
            Enter the sale details for {property?.address}
          </DialogDescription>
        </DialogHeader>
        
        {/* Cost Summary */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Cost Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Bid Amount</p>
              <p className="font-semibold">${property?.bidAmount?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="font-semibold">${totalExpenses.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Cost</p>
              <p className="font-bold">${costBasis.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="soldAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Sale Amount ($)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="75000.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="soldDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Sale Date
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Live Profit Calculation */}
            {soldAmount > 0 && (
              <div className={cn(
                "p-4 rounded-lg border-2",
                estimatedProfit >= 0 
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" 
                  : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={cn(
                      "text-xs font-medium",
                      estimatedProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                      Estimated Profit/Loss
                    </p>
                    <p className={cn(
                      "text-2xl font-bold",
                      estimatedProfit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
                    )}>
                      {estimatedProfit >= 0 ? "+" : ""}${estimatedProfit.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xs font-medium",
                      estimatedProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                      ROI
                    </p>
                    <p className={cn(
                      "text-xl font-bold",
                      estimatedProfit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
                    )}>
                      {roi >= 0 ? "+" : ""}{roi.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || soldAmount <= 0}
                className={cn(
                  estimatedProfit >= 0 
                    ? "bg-emerald-600 hover:bg-emerald-700" 
                    : "bg-violet-600 hover:bg-violet-700"
                )}
              >
                {isLoading ? "Saving..." : "Confirm Sale"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
