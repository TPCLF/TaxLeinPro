"use client"

import { useState } from "react"
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
import { format } from "date-fns"
import { DollarSign, Calendar, TrendingUp } from "lucide-react"

const soldSchema = z.object({
  soldAmount: z.string().min(1, "Sale amount is required"),
  soldDate: z.string().min(1, "Sale date is required"),
})

type SoldFormData = z.infer<typeof soldSchema>

interface SoldModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: Property | null
  onConfirm: (data: SoldFormData) => Promise<void>
  isLoading?: boolean
}

export function SoldModal({ open, onOpenChange, property, onConfirm, isLoading }: SoldModalProps) {
  const form = useForm<SoldFormData>({
    resolver: zodResolver(soldSchema),
    defaultValues: {
      soldAmount: property?.soldAmount?.toString() || "",
      soldDate: property?.soldDate 
        ? new Date(property.soldDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
  })

  const handleSubmit = async (data: SoldFormData) => {
    await onConfirm(data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Mark Property as Sold
          </DialogTitle>
          <DialogDescription>
            Enter the sale details for {property?.address}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Confirm Sale"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
