import { BookOpen, LayoutDashboard, MapPinned, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useMatches } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/villages', label: 'Villages', icon: MapPinned, end: false },
]

// The frame around every page: sidebar on the left, top bar above, and the page itself in <Outlet />.
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false) // only matters on small screens

  // Each route declares a title in App.tsx ("handle"). Read the title of the deepest matching route.
  const matches = useMatches()
  const title = (matches[matches.length - 1]?.handle as { title?: string } | undefined)?.title ?? 'SurveyOps Lite'

  // Keep the browser tab title in sync with the page.
  useEffect(() => {
    document.title = `${title} · SurveyOps Lite`
  }, [title])

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Dark overlay behind the mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-teal-700 text-white">
            <MapPinned className="size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">SurveyOps Lite</span>
        </div>

        <nav aria-label="Main" className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)} // on small screens, close the drawer after choosing a page
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <p className="border-t border-slate-200 p-4 text-xs leading-relaxed text-slate-500">
          Independent portfolio project using fictional data. Not affiliated with Survey of India or NAKSHA.
        </p>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="-ml-1 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <p className="flex-1 truncate font-medium text-slate-900">{title}</p>
          <a
            href="/api/docs/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <BookOpen className="size-4" aria-hidden="true" />
            API docs
          </a>
        </header>

        {menuOpen && (
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="fixed right-3 top-3 z-50 rounded-lg bg-white p-2 text-slate-600 shadow lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        )}

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
