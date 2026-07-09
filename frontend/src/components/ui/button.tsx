import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4f8ef7] disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default:
          'bg-[#1d2632] text-[#dce8ef] border border-[#2a3545] hover:bg-[#253041] hover:border-[#3a4d62]',
        primary:
          'bg-[#4f8ef7] text-white border border-[#3a7ae0] hover:bg-[#3a7ae0]',
        teal:
          'bg-[#62dbc1] text-[#0b0e13] border border-[#4ecfb5] hover:bg-[#4ecfb5]',
        danger:
          'bg-[#e76d78] text-white border border-[#d05060] hover:bg-[#d05060]',
        warn:
          'bg-[#d9a65f] text-[#0b0e13] border border-[#c49048] hover:bg-[#c49048]',
        ghost:
          'bg-transparent text-[#8da0af] border border-transparent hover:bg-[#121821] hover:text-[#dce8ef]',
        wide:
          'w-full bg-[#2dbb7f] text-white border border-[#25a86e] hover:bg-[#25a86e]',
      },
      size: {
        default: 'min-h-[28px] px-2.5 py-1',
        sm: 'min-h-[24px] px-2 py-0.5 text-[10px]',
        lg: 'min-h-[34px] px-4 py-1.5 text-[12px]',
        icon: 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
