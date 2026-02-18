"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Property, PropertyType } from "@prisma/client"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
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
import { Separator } from "@/components/ui/separator"

const propertySchema = z.object({
  parcelNumber: z.string().min(1, "Parcel number is required"),
  address: z.string().min(1, "Address is required"),
  priorOwner: z.string().optional(),
  propertyType: z.enum(["RESIDENTIAL", "COMMERCIAL", "LAND", "INDUSTRIAL", "AGRICULTURAL", "OTHER"]),
  bidAmount: z.string().min(1, "Bid amount is required"),
  currentValue: z.string().min(1, "Current value is required"),
  askingPrice: z.string().optional(),
  purchaseDate: z.string().optional(),
})

type PropertyFormData = z.infer<typeof propertySchema>

interface PropertyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property?: Property | null
  onSubmit: (data: PropertyFormData) => Promise<void>
  isLoading?: boolean
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "LAND", label: "Land" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "AGRICULTURAL", label: "Agricultural" },
  { value: "OTHER", label: "Other" },
]

export function PropertyForm({ open, onOpenChange, property, onSubmit, isLoading }: PropertyFormProps) {
  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      parcelNumber: property?.parcelNumber || "",
      address: property?.address || "",
      priorOwner: property?.priorOwner || "",
      propertyType: property?.propertyType || "RESIDENTIAL",
      bidAmount: property?.bidAmount?.toString() || "",
      currentValue: property?.currentValue?.toString() || "",
      askingPrice: property?.askingPrice?.toString() || "",
      purchaseDate: property?.purchaseDate 
        ? new Date(property.purchaseDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
    },
  })

  const handleSubmit = async (data: PropertyFormData) => {
    await onSubmit(data)
    form.reset()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {property ? "Edit Property" : "Add New Property"}
          </SheetTitle>
          <SheetDescription>
            Enter the property details for your tax lien portfolio.
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Property Information</h4>
              
              <FormField
                control={form.control}
                name="parcelNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcel Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="123-456-789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, State 12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priorOwner"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prior Owner</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormDescription>
                      Name of the previous property owner
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROPERTY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Financial Information</h4>
              
              <FormField
                control={form.control}
                name="bidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bid Amount ($) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="5000.00" {...field} />
                    </FormControl>
                    <FormDescription>
                      Amount paid at the tax lien auction
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Estimated Value ($) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="50000.00" {...field} />
                    </FormControl>
                    <FormDescription>
                      Current estimated market value of the property
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="askingPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asking Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="55000.00" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your asking price when listing for sale (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Saving..." : property ? "Update Property" : "Add Property"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
