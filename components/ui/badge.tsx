import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'referral' | 'close' | 'shoutout' | 'message' | 'pending' | 'active' | 'inactive' | 'admin'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  referral: 'bg-green-100 text-green-800',
  close: 'bg-yellow-100 text-yellow-800',
  shoutout: 'bg-blue-100 text-blue-800',
  message: 'bg-gray-100 text-gray-600',
  pending: 'bg-orange-100 text-orange-700',
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
  admin: 'bg-primary text-white',
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
