import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white hover:bg-primary-light shadow-sm shadow-primary/20 hover:shadow-primary/30 hover:shadow-md active:scale-[0.98]',
        secondary:
          'bg-surface3 text-slate-200 hover:bg-border2 border border-border active:scale-[0.98]',
        ghost:
          'text-slate-400 hover:text-slate-200 hover:bg-white/5 active:scale-[0.98]',
        outline:
          'border border-border text-slate-300 hover:border-border2 hover:bg-white/5 active:scale-[0.98]',
        destructive:
          'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 active:scale-[0.98]',
        accent:
          'bg-accent text-bg font-semibold hover:bg-accent-light shadow-sm shadow-accent/20 active:scale-[0.98]',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs',
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-10 px-5 text-sm',
        xl: 'h-12 px-6 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, icon, iconPosition = 'left', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {!loading && icon && iconPosition === 'left' && (
          <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
