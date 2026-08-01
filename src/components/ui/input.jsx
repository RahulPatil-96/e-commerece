import * as React from "react"

import { cn } from "@/lib/utils"

/** @typedef {React.ComponentPropsWithoutRef<'input'>} InputProps */

const Input = React.forwardRef(/** @param {InputProps} props @param {React.Ref<HTMLInputElement>} ref */ ({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-full border border-input bg-card/70 px-4 py-2 text-base shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }

