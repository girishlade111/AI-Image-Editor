"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-white/[0.06]">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-[#e94560] to-[#ff6b6b] rounded-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-3.5 w-3.5 rounded-full border-2 border-[#e94560] bg-metal-600 shadow-[0_1px_4px_rgba(0,0,0,0.3)] ring-offset-1 ring-offset-metal-700 transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e94560]/40 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
