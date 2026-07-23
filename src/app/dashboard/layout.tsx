"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect } from "react"
import { SessionProvider } from "next-auth/react"

function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/dashboard/agendar", label: "Agendar Cirurgia", icon: "📅", adminOnly: true },
    { href: "/dashboard/minhas-cirurgias", label: "Minhas Cirurgias", icon: "🏥" },
    { href: "/dashboard/relatorios", label: "Relatórios", icon: "📋", adminOnly: true },
    { href: "/dashboard/usuarios", label: "Usuários", icon: "👥", adminOnly: true },
  ]

  return (
    <aside className="flex h-screen w-64 flex-col text-white sidebar-gradient">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-lg"
          style={{ background: "linear-gradient(135deg, #38bdf8, #0284c7)" }}>
          SC
        </div>
        <div>
          <h2 className="text-sm font-bold">AgendaCir</h2>
          <p className="text-xs text-sky-300">{session?.user?.name}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {links
          .filter((l) => !l.adminOnly || isAdmin)
          .map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="text-lg">{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-all"
        >
          <span className="text-lg">🚪</span>
          Sair
        </button>
      </div>
    </aside>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  )
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#f0f4f8" }}>
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></div>
          <span className="text-gray-500">Carregando...</span>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex min-h-screen" style={{ background: "#f0f4f8" }}>
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
