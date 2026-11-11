import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils/cn';
import { Slot } from '@radix-ui/react-slot';

// Every button shares one motion system: a gentle lift + shadow on hover,
// a press-down scale on click, and a visible brand-green focus ring.
// Primary CTAs (brand / sun) also get the shine sweep (.btn-shine in globals.css).
const buttonVariants = cva(
  'w-fit inline-flex items-center justify-center whitespace-nowrap text-sm rounded-md font-alt font-medium transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none',
  {
    variants: {
      variant: {
        default: 'bg-brand-ink text-white hover:bg-brand-ink/90',
        brand: 'btn-shine bg-brand-green text-white hover:bg-brand-green/90 shadow-sm',
        sun: 'btn-shine bg-brand-sun text-brand-ink hover:bg-brand-sun/90 shadow-sm',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-brand-line bg-white text-brand-ink hover:bg-brand-greenSoft hover:border-brand-green/40',
        secondary: 'bg-brand-greenSoft text-brand-green hover:bg-brand-greenSoft/70',
        ghost: 'text-brand-ink hover:bg-brand-greenSoft',
        link: 'text-primary underline-offset-4 hover:underline hover:translate-y-0 hover:shadow-none',
        orange: 'bg-orange-500 text-white hover:bg-orange-400',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
