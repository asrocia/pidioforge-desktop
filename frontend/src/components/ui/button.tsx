/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-[11px] font-semibold transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ds-bg-base disabled:pointer-events-none disabled:opacity-40 disabled:grayscale will-change-transform',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-b from-ds-bg-panel-2 to-ds-bg-panel text-ds-text border-2 border-ds-line shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_2px_4px_rgba(0,0,0,0.3)] hover:from-ds-bg-hover hover:to-ds-bg-panel-2 hover:border-ds-line-strong hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_3px_6px_rgba(0,0,0,0.4)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:scale-[0.98]',
        primary:
          'bg-gradient-to-br from-ds-accent to-ds-accent-hover text-white border-2 border-ds-accent-hover shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_8px_rgba(90,158,255,0.4),0_2px_4px_rgba(0,0,0,0.3)] hover:from-ds-accent-hover hover:to-ds-accent hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_12px_rgba(90,158,255,0.5),0_3px_6px_rgba(0,0,0,0.4)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:scale-[0.98]',
        teal: 'bg-gradient-to-br from-ds-teal to-[#4dd4ba] text-ds-bg-base border-2 border-ds-teal shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_8px_rgba(94,234,212,0.4),0_2px_4px_rgba(0,0,0,0.3)] hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_12px_rgba(94,234,212,0.5),0_3px_6px_rgba(0,0,0,0.4)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:scale-[0.98]',
        danger:
          'bg-gradient-to-br from-ds-danger to-[#dc5a64] text-white border-2 border-ds-danger shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_8px_rgba(248,113,113,0.4),0_2px_4px_rgba(0,0,0,0.3)] hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_12px_rgba(248,113,113,0.5),0_3px_6px_rgba(0,0,0,0.4)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:scale-[0.98]',
        warn: 'bg-gradient-to-br from-ds-warn to-[#f59e0b] text-ds-bg-base border-2 border-ds-warn shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_8px_rgba(251,191,36,0.4),0_2px_4px_rgba(0,0,0,0.3)] hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_12px_rgba(251,191,36,0.5),0_3px_6px_rgba(0,0,0,0.4)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:scale-[0.98]',
        ghost:
          'bg-transparent text-ds-muted border-2 border-transparent hover:bg-ds-bg-hover hover:text-ds-text hover:border-ds-line hover:shadow-[0_2px_4px_rgba(0,0,0,0.2)] active:scale-[0.98]',
        wide: 'w-full bg-gradient-to-br from-ds-accent to-ds-accent-hover text-white border-2 border-ds-accent-hover shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_8px_rgba(90,158,255,0.4),0_2px_4px_rgba(0,0,0,0.3)] hover:brightness-110 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_12px_rgba(90,158,255,0.5),0_3px_6px_rgba(0,0,0,0.4)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] active:scale-[0.98]',
      },
      size: {
        default: 'h-8 px-3 py-1',
        sm: 'h-7 px-2.5 py-0.5 text-[10px]',
        lg: 'h-9 px-4 py-1.5 text-[12px]',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
