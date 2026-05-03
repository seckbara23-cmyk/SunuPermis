'use client'

// TODO: update 'super_admin' to 'government_admin' once the DB enum is migrated

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'

const navLinks = [
  { href: '/dashboard',                    label: 'Tableau de bord',         roles: ['super_admin', 'school_admin', 'instructor', 'student'] },
  { href: '/dashboard/schools',            label: 'Auto-écoles',             roles: ['super_admin'] },
  { href: '/dashboard/students',           label: 'Élèves',                  roles: ['super_admin', 'school_admin'] },
  { href: '/dashboard/instructors',        label: 'Moniteurs',               roles: ['super_admin', 'school_admin'] },
  { href: '/dashboard/lessons',            label: 'Leçons',                  roles: ['super_admin', 'school_admin', 'instructor'] },
  { href: '/dashboard/appointments-admin', label: 'Gestion des rendez-vous', roles: ['super_admin'] },
  { href: '/dashboard/appointments',       label: 'Rendez-vous',             roles: ['school_admin', 'student'] },
  { href: '/dashboard/exams',              label: 'Examens',                 roles: ['super_admin', 'school_admin', 'student'] },
  { href: '/dashboard/payments',           label: 'Paiements',               roles: ['super_admin', 'school_admin'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile } = useUser()

  const role = profile?.role ?? null
  const visibleLinks = role
    ? navLinks.filter((l) => l.roles.includes(role))
    : navLinks.filter((l) => l.roles.includes('student')) // safe fallback while loading

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100 shrink-0">
        <span className="text-xl font-bold text-navy">SunuPermis</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleLinks.map(({ href, label }) => {
          const isActive =
            href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-navy/10 text-navy'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
