"use client"

import { useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: string
  _count: { surgeries: number }
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/users").then((r) => r.json()).then(setUsers).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
        <p className="text-sm text-gray-500 mt-1">Todos os usuários cadastrados</p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-medium uppercase text-gray-500 bg-gray-50">
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Usuário</th>
                <th className="px-6 py-3">Telefone</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Cirurgias</th>
                <th className="px-6 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="text-sm text-gray-700 hover:bg-sky-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{u.name}</td>
                  <td className="px-6 py-4 text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">{u.phone || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.role === "ADMIN" ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {u.role === "ADMIN" ? "Admin" : "Usuário"}
                    </span>
                  </td>
                  <td className="px-6 py-4">{u._count.surgeries}</td>
                  <td className="px-6 py-4">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
