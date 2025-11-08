'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon?: string
}

export default function Navigation({ role }: { role: 'student' | 'admin' }) {
  const pathname = usePathname()
  
  const studentNav: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Book Session', href: '/bookings' },
    { label: 'My Progress', href: '/progress' },
    { label: 'Profile', href: '/profile' }
  ]
  
  const adminNav: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Manage Bookings', href: '/admin/bookings' },
    { label: 'Availability', href: '/admin/availability' },
  ]
  
  const navItems = role === 'admin' ? adminNav : studentNav
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-blue-600">Acing Maths</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
