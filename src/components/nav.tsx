'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Package, ScanLine, Bell, ChefHat } from 'lucide-react'
import clsx from 'clsx'

const links = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/scan', label: 'Scan', icon: ScanLine, primary: true },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/recipes', label: 'Recipes', icon: ChefHat },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 bottom-nav-height">
      <div className="flex items-center justify-around h-16">
        {links.map(({ href, label, icon: Icon, primary }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors',
                primary
                  ? 'relative'
                  : active
                  ? 'text-green-600'
                  : 'text-gray-400'
              )}
            >
              {primary ? (
                <span className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-green-600 shadow-lg shadow-green-200">
                  <Icon className="w-6 h-6 text-white" />
                </span>
              ) : (
                <>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
