"use client"

import { useState, useEffect } from "react"

interface Surgery {
  id: string
  date: string
  time: string
  insurance: string
  status: string
  grossValue: number | null
  hospital: { name: string }
  surgeon: { name: string }
  company: { name: string }
  surgeryType: { name: string }
}

export default function MinhasCirurgiasPage() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/surgeries")
      .then((r) => r.json())
      .then(setSurgeries)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Minhas Cirurgias</h1>
        <p className="text-sm text-gray-500 mt-1">Suas cirurgias agendadas</p>
      </div>

      {surgeries.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="text-4xl mb-4 block">🏥</span>
          <p className="text-lg text-gray-500">Nenhuma cirurgia agendada para você.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {surgeries.map((s) => (
            <div key={s.id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-800">{s.surgeryType.name}</h3>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      s.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" :
                      s.status === "SCHEDULED" ? "bg-amber-100 text-amber-700" :
                      "bg-sky-100 text-sky-700"
                    }`}>
                      {s.status === "CONFIRMED" ? "Confirmada" : s.status === "SCHEDULED" ? "Agendada" : "Realizada"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-700">Data:</span> {new Date(s.date).toLocaleDateString("pt-BR")}</p>
                    <p><span className="font-medium text-gray-700">Horário:</span> {s.time}</p>
                    <p><span className="font-medium text-gray-700">Hospital:</span> {s.hospital.name}</p>
                    <p><span className="font-medium text-gray-700">Cirurgião:</span> {s.surgeon.name}</p>
                    <p><span className="font-medium text-gray-700">Convênio:</span> {s.insurance}</p>
                    <p><span className="font-medium text-gray-700">Empresa:</span> {s.company.name}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
