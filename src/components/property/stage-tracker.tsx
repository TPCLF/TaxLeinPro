"use client"

import { PropertyStage } from "@prisma/client"

const STAGES: { value: PropertyStage; label: string; color: string }[] = [
  { value: "PURCHASED", label: "Purchased", color: "bg-slate-500" },
  { value: "RR_FORECLOSED", label: "RR Foreclosed", color: "bg-amber-500" },
  { value: "QUIET_TITLED", label: "Quiet Titled", color: "bg-emerald-500" },
  { value: "FOR_SALE", label: "For Sale", color: "bg-sky-500" },
  { value: "SOLD", label: "Sold", color: "bg-violet-500" },
]

interface StageTrackerProps {
  currentStage: PropertyStage
  onStageChange: (stage: PropertyStage) => void
  disabled?: boolean
}

export function StageTracker({ currentStage, onStageChange, disabled }: StageTrackerProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-1 mb-2">
        {STAGES.map((stage, index) => {
          const isActive = stage.value === currentStage
          const isPast = STAGES.findIndex(s => s.value === currentStage) > index
          
          return (
            <div key={stage.value} className="flex-1 flex flex-col items-center">
              <button
                type="button"
                onClick={() => !disabled && onStageChange(stage.value)}
                disabled={disabled}
                className={`
                  w-full h-3 rounded-full transition-all duration-300 
                  ${isActive ? stage.color + " ring-2 ring-offset-2 ring-offset-background" : ""}
                  ${isPast ? stage.color + " opacity-80" : "bg-muted"}
                  ${!disabled ? "cursor-pointer hover:opacity-80" : "cursor-not-allowed"}
                `}
                title={stage.label}
              />
              <span className={`
                text-[10px] mt-1 text-center leading-tight hidden sm:block
                ${isActive ? "font-semibold text-foreground" : "text-muted-foreground"}
              `}>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-between sm:hidden">
        <span className="text-xs font-medium text-foreground">
          {STAGES.find(s => s.value === currentStage)?.label}
        </span>
      </div>
    </div>
  )
}
