import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value, onChange, ...props }, ref) => {
    // Preparar props base
    const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
      type,
      className: cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm touch-manipulation",
        className,
      ),
      ref,
      ...props,
    };
    
    // Se value ou onChange foram passados, sempre tratar como controlado
    // Isso evita a mudança de não controlado para controlado
    // Convertendo undefined/null para string vazia para manter consistência
    const isControlled = value !== undefined || onChange !== undefined;
    
    if (isControlled) {
      // Sempre passar value como string (vazia se undefined/null)
      inputProps.value = value === null || value === undefined ? "" : String(value);
      if (onChange) {
        inputProps.onChange = onChange;
      }
    }
    // Se nem value nem onChange foram passados, input é não controlado (não passar essas props)
    
    return <input {...inputProps} />;
  },
);
Input.displayName = "Input";

export { Input };
