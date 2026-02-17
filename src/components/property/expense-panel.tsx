"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Expense, ExpenseCategory, Property } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { Plus, Trash2, Receipt, DollarSign } from "lucide-react"
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

const expenseSchema = z.object({
  category: z.enum(["LEGAL", "MAINTENANCE", "TAXES", "INSURANCE", "MARKETING", "TITLE_WORK", "AUCTION_FEE", "OTHER"]),
  description: z.string().min(1, "Description is required"),
  amount: z.string().min(1, "Amount is required"),
  date: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpensePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: Property | null
  expenses: Expense[]
  onAddExpense: (data: ExpenseFormData) => Promise<void>
  onDeleteExpense: (id: string) => Promise<void>
  isLoading?: boolean
}

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "LEGAL", label: "Legal Fees" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "TAXES", label: "Property Taxes" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "MARKETING", label: "Marketing" },
  { value: "TITLE_WORK", label: "Title Work" },
  { value: "AUCTION_FEE", label: "Auction Fee" },
  { value: "OTHER", label: "Other" },
]

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  LEGAL: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  MAINTENANCE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  TAXES: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  INSURANCE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MARKETING: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  TITLE_WORK: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  AUCTION_FEE: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

export function ExpensePanel({
  open,
  onOpenChange,
  property,
  expenses,
  onAddExpense,
  onDeleteExpense,
  isLoading,
}: ExpensePanelProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null)
  
  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "OTHER",
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
    },
  })

  const handleSubmit = async (data: ExpenseFormData) => {
    await onAddExpense(data)
    form.reset()
    setShowAddForm(false)
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Expenses
          </SheetTitle>
          <SheetDescription>
            {property?.address} - Parcel: {property?.parcelNumber}
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Expenses:</span>
              <span className="font-semibold">${totalExpenses.toLocaleString()}</span>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Expense
            </Button>
          </div>
          
          {showAddForm && (
            <div className="p-4 border rounded-lg mb-4 space-y-4 bg-muted/50">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <Select 
                      onValueChange={(value) => form.setValue("category", value as ExpenseCategory)}
                      defaultValue={form.getValues("category")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Amount ($)</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      {...form.register("amount")}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea 
                    placeholder="Describe this expense..."
                    {...form.register("description")}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Date</label>
                  <Input 
                    type="date" 
                    {...form.register("date")}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={isLoading}>
                    Save Expense
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
          
          <Separator />
          
          <ScrollArea className="flex-1 mt-4">
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No expenses recorded yet</p>
                <p className="text-sm">Add your first expense to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-sm">
                        {format(new Date(expense.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={CATEGORY_COLORS[expense.category]}>
                          {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {expense.description}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${expense.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteExpenseId(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </div>
        
        <AlertDialog open={!!deleteExpenseId} onOpenChange={() => setDeleteExpenseId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this expense? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteExpenseId) {
                    onDeleteExpense(deleteExpenseId)
                    setDeleteExpenseId(null)
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  )
}
