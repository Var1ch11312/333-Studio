"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-gold cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:brightness-110 active:brightness-90",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-secondary",
        ghost:
          "bg-transparent text-foreground hover:bg-secondary",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-110",
      },
      size: {
        default: "h-10 px-5 py-2 rounded",
        sm: "h-8 px-3 text-xs rounded",
        lg: "h-12 px-8 text-base rounded",
        icon: "h-10 w-10 rounded",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
