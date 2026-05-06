'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'

interface NavLink { href: string; label: string }

interface Props {
  navLinks: NavLink[]
  subtitle: string
  homeHref: string
  children: React.ReactNode
}

const ROLE_LABEL: Record<string, string> = {
  super_admin:  'Super Admin',
  school_admin: 'Admin École',
  instructor:   'Moniteur',
  student:      'Élève',
}

export default function DashboardShell({ navLinks, subtitle, homeHref, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { profile } = useUser()

  function isActive(href: string) {
    return href === homeHref
      ? pathname === homeHref
      : pathname === href || pathname.startsWith(href + '/')
  }

  const navItems = navLinks.map(({ href, label }) => (
    <Link
      key={href}
      href={href}
      onClick={() => setSidebarOpen(false)}
      className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive(href)
          ? 'bg-navy/10 text-navy'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  ))

  const sidebarHeader = (
    <div className="px-6 py-5 border-b border-gray-100 shrink-0">
      <span className="text-xl font-bold text-navy">SunuPermis</span>
      <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  )

  const nav = <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">{navItems}</nav>

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <div className="h-1 shrink-0 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />

      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden md:flex w-60 shrink-0 bg-white border-r border-gray-200 flex-col">
          {sidebarHeader}
          {nav}
        </aside>

        {/* ── Mobile: backdrop ────────────────────────────────────────────── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* ── Mobile: slide-in drawer ──────────────────────────────────────── */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ease-in-out md:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-label="Navigation principale"
        >
          <div className="flex items-center justify-between pl-6 pr-3 py-5 border-b border-gray-100 shrink-0">
            <div>
              <span className="text-xl font-bold text-navy">SunuPermis</span>
              <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer le menu"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {nav}
        </aside>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* Header */}
          <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">

            {/* Hamburger (mobile) / spacer (desktop) */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu de navigation"
              className="md:hidden p-2 -ml-1 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="hidden md:block" />

            {/* User info + logout */}
            <div className="flex items-center gap-3">
              {profile && (
                <>
                  <div className="hidden sm:flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy text-sm font-bold shrink-0">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm leading-tight">
                      <p className="font-medium text-gray-900 max-w-[140px] truncate">{profile.full_name}</p>
                      <p className="text-gray-400 text-xs">{ROLE_LABEL[profile.role] ?? profile.role}</p>
                    </div>
                  </div>
                  {/* Avatar only on small screens */}
                  <div className="sm:hidden w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-navy text-sm font-bold shrink-0">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block w-px h-6 bg-gray-200" />
                </>
              )}

              <form method="POST" action="/auth/logout">
                <button
                  type="submit"
                  aria-label="Se déconnecter"
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              </form>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
