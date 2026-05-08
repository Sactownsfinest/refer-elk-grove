import { cn } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

function getInitials(name: string | null | undefined) {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getColor(name: string | null | undefined) {
  const colors = [
    'bg-primary', 'bg-secondary', 'bg-accent text-accent-foreground',
    'bg-purple-500', 'bg-pink-500', 'bg-teal-500',
  ]
  if (!name) return colors[0]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Member'}
        className={cn('rounded-full object-cover flex-shrink-0', sizes[size], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
        sizes[size],
        getColor(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
