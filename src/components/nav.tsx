'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, ScanLine, Bell, ChefHat } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/inventory', label: 'Stock', icon: Package },
  { href: '/scan', label: 'Scan', icon: ScanLine, primary: true },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/recipes', label: 'Recipes', icon: ChefHat },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border bottom-nav-height">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {links.map(({ href, label, icon: Icon, primary }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                !primary && (active ? 'text-primary' : 'text-muted-foreground')
              )}
            >
              {primary ? (
                <span className="flex items-center justify-center w-12 h-12 -mt-6 rounded-2xl bg-primary shadow-lg shadow-primary/25">
                  <Icon className="w-5 h-5 text-primary-foreground" />
                </span>
              ) : (
                <>
                  <Icon className={cn('w-5 h-5', active && 'stroke-[2.5]')} />
                  <span className="text-[10px] font-medium tracking-wide">{label}</span>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
