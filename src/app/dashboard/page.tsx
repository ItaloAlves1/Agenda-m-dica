"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"

interface DashboardData {
  totalSurgeries: number
  todaySurgeries: number
  totalGrossValue: number
  totalMaterialCost: number
  monthlySurgeries: Array<{
    id: string
    date: string
    time: string
    patientName: string
    hospital: { name: string }
    surgeon: { name: string }
    company: { name: string }
    surgeryType: { name: string }
    grossValue: number | null
    materialCost: number | null
    status: string
    user: { name: string; phone: string | null }
  }>
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/surgeries?dashboard=true")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></div>
      </div>
    )
  }

  const profit = (data?.totalGrossValue ?? 0) - (data?.totalMaterialCost ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <span className="text-lg">📋</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Cirurgias</p>
              <p className="text-2xl font-bold text-gray-800">{data?.totalSurgeries ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <span className="text-lg">📅</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hoje</p>
              <p className="text-2xl font-bold text-gray-800">{data?.todaySurgeries ?? 0}</p>
            </div>
          </div>
        </div>
        {isAdmin && (
          <>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <span className="text-lg">💰</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Valor Bruto</p>
                  <p className="text-2xl font-bold text-gray-800">
                    R$ {(data?.totalGrossValue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <span className="text-lg">📈</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lucro Estimado</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Cirurgias do Mês</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-medium uppercase text-gray-500 bg-gray-50">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Hospital</th>
                <th className="px-4 py-3">Cirurgião</th>
                <th className="px-4 py-3">Procedimento</th>
                <th className="px-4 py-3">Empresa</th>
                {isAdmin && <><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Custo</th></>}
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.monthlySurgeries?.map((s) => (
                <tr key={s.id} className="text-sm text-gray-700 hover:bg-sky-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{new Date(s.date).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">{s.time}</td>
                  <td className="px-4 py-3">{s.hospital.name}</td>
                  <td className="px-4 py-3">{s.surgeon.name}</td>
                  <td className="px-4 py-3">{s.surgeryType.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                      {s.company.name}
                    </span>
                  </td>
                  {isAdmin && (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {s.grossValue ? `R$ ${s.grossValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}
                      </td>
                      <td className="px-4 py-3 text-red-600">
                        {s.materialCost ? `R$ ${s.materialCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" :
                      s.status === "SCHEDULED" ? "bg-amber-100 text-amber-700" :
                      s.status === "COMPLETED" ? "bg-sky-100 text-sky-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {s.status === "CONFIRMED" ? "Confirmada" : s.status === "SCHEDULED" ? "Agendada" :
                       s.status === "COMPLETED" ? "Realizada" : "Cancelada"}
                    </span>
                  </td>
                </tr>
              ))}
              {(!data?.monthlySurgeries || data.monthlySurgeries.length === 0) && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    Nenhuma cirurgia agendada este mês
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
