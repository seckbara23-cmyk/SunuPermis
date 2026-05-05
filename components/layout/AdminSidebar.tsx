'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/admin',               label: 'Tableau de bord'    },
  { href: '/admin/auto-ecoles',   label: 'Auto-écoles'        },
  { href: '/admin/students',      label: 'Élèves'             },
  { href: '/admin/reservations',  label: 'Rendez-vous'        },
  { href: '/admin/exam-sessions', label: "Sessions d'examen"  },
  { href: '/admin/exam-bookings', label: 'Réservations'       },
  { href: '/admin/results',       label: 'Résultats'          },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100 shrink-0">
        <span className="text-xl font-bold text-navy">SunuPermis</span>
        <p className="text-xs text-gray-400 mt-0.5">Administration</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navLinks.map(({ href, label }) => {
          const isActive =
            href === '/admin'
              ? pathname === '/admin'
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
