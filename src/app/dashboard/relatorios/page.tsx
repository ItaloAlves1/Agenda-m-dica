"use client"

import { useState, useEffect } from "react"
import { jsPDF } from "jspdf"
import "jspdf-autotable"

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface Surgery {
  id: string
  date: string
  time: string
  insurance: string
  status: string
  grossValue: number | null
  materialCost: number | null
  hospital: { name: string }
  surgeon: { name: string }
  company: { name: string }
  surgeryType: { name: string }
  user: { name: string; phone: string | null }
  notifications?: { phoneNumber: string; type: string; sentAt: string }[]
}

const statusLabel: Record<string, string> = {
  CONFIRMED: "Confirmada",
  SCHEDULED: "Agendada",
  COMPLETED: "Realizada",
  CANCELLED: "Cancelada",
}

const statusColor: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  SCHEDULED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-sky-100 text-sky-700",
  CANCELLED: "bg-red-100 text-red-700",
}

export default function RelatoriosPage() {
  const [surgeries, setSurgeries] = useState<Surgery[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedSurgeon, setSelectedSurgeon] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [dateRange, setDateRange] = useState({ start: "", end: "" })

  useEffect(() => {
    Promise.all([
      fetch("/api/surgeries?report=monthly").then((r) => r.json()),
      fetch("/api/surgeries/select?type=users").then((r) => r.json()),
    ]).then(([surgRes, userRes]) => {
      setSurgeries(Array.isArray(surgRes) ? surgRes : surgRes.monthlySurgeries ?? [])
      setUsers(userRes)
      setLoading(false)
    })
  }, [])

  function filterSurgeries() {
    let filtered = [...surgeries]
    if (selectedCompany) filtered = filtered.filter((s) => s.company.name === selectedCompany)
    if (selectedSurgeon) filtered = filtered.filter((s) => s.surgeon.name === selectedSurgeon)
    if (selectedUser) filtered = filtered.filter((s) => s.user.name === selectedUser)
    if (selectedStatus) filtered = filtered.filter((s) => s.status === selectedStatus)
    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start)
      const end = new Date(dateRange.end)
      filtered = filtered.filter((s) => { const d = new Date(s.date); return d >= start && d <= end })
    }
    return filtered
  }

  const filteredData = filterSurgeries()

  const totalGross = filteredData.reduce((a, s) => a + (s.grossValue ?? 0), 0)
  const totalMaterial = filteredData.reduce((a, s) => a + (s.materialCost ?? 0), 0)
  const totalProfit = totalGross - totalMaterial

  const companies = [...new Set(surgeries.map((s) => s.company.name))].sort()
  const surgeons = [...new Set(surgeries.map((s) => s.surgeon.name))].sort()

  function generatePDF(title: string, data: Surgery[]) {
    const doc = new jsPDF("landscape")
    const pw = doc.internal.pageSize.width
    doc.setFontSize(18); doc.text(title, pw / 2, 20, { align: "center" })
    doc.setFontSize(10); doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, pw / 2, 28, { align: "center" })
    doc.autoTable({
      startY: 35,
      head: [["Data", "Hora", "Local", "Cirurgião", "Procedimento", "Empresa", "Convênio", "Paciente", "Valor Bruto", "Custo Mat.", "Lucro", "Status"]],
      body: data.map((s) => {
        const gv = s.grossValue ?? 0
        const mc = s.materialCost ?? 0
        return [
          new Date(s.date).toLocaleDateString("pt-BR"), s.time, s.hospital.name, s.surgeon.name,
          s.surgeryType.name, s.company.name, s.insurance, s.user.name,
          `R$ ${gv.toFixed(2)}`,
          mc > 0 ? `R$ ${mc.toFixed(2)}` : "-",
          gv > 0 ? `R$ ${(gv - mc).toFixed(2)}` : "-",
          statusLabel[s.status] || s.status,
        ]
      }),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [56, 189, 248] },
    })
    const fy = (doc as any).lastAutoTable?.finalY ?? 35
    doc.setFontSize(10)
    doc.text(`Total Cirurgias: ${data.length}`, 14, fy + 10)
    doc.text(`Valor Bruto Total: R$ ${totalGross.toFixed(2)}`, 14, fy + 18)
    doc.text(`Custo Material Total: R$ ${totalMaterial.toFixed(2)}`, 14, fy + 26)
    doc.text(`Lucro Total: R$ ${totalProfit.toFixed(2)}`, 14, fy + 34)
    doc.save(`${title.replace(/\s+/g, "_")}.pdf`)
  }

  function generateCompanyReport(company: string) {
    let filtered = surgeries.filter((s) => s.company.name === company)
    if (filtered.length === 0) { alert(`Nenhuma cirurgia para ${company}`); return }
    if (company === "TITANIUM") {
      filtered = filtered.map((s) => ({ ...s, grossValue: s.grossValue ? s.grossValue * 1.1 : null, materialCost: 0 }))
    }
    generatePDF(`Relatório ${company}`, filtered)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent"></div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        <p className="text-sm text-gray-500 mt-1">Visualize e exporte relatórios detalhados</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Cirurgias</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{filteredData.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Valor Bruto</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">R$ {totalGross.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Custo Material</p>
          <p className="text-2xl font-bold text-red-600 mt-1">R$ {totalMaterial.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lucro</p>
          <p className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            R$ {totalProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Filtros</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
            <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Todas</option>
              {companies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cirurgião</label>
            <select value={selectedSurgeon} onChange={(e) => setSelectedSurgeon(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Todos</option>
              {surgeons.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
            <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Todos</option>
              {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Todos</option>
              <option value="CONFIRMED">Confirmada</option>
              <option value="SCHEDULED">Agendada</option>
              <option value="COMPLETED">Realizada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button onClick={() => generatePDF("Relatorio_Geral", filteredData)}
          className="card p-5 text-left hover:shadow-md transition-all group">
          <h3 className="font-semibold text-gray-800 group-hover:text-sky-600 transition-colors">📋 Relatório Geral</h3>
          <p className="mt-1 text-sm text-gray-500">{filteredData.length} cirurgias · R$ {totalGross.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </button>
        {companies.map((company) => {
          const compData = surgeries.filter((s) => s.company.name === company)
          const compGross = compData.reduce((a, s) => a + (s.grossValue ?? 0), 0)
          return (
            <button key={company} onClick={() => generateCompanyReport(company)}
              className="card p-5 text-left hover:shadow-md transition-all group">
              <h3 className="font-semibold text-gray-800 group-hover:text-sky-600 transition-colors">🏢 {company}</h3>
              <p className="mt-1 text-sm text-gray-500">{compData.length} cirurgias · R$ {compGross.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </button>
          )
        })}
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Cirurgias {selectedCompany && `- ${selectedCompany}`}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="text-left text-xs font-medium uppercase text-gray-500 bg-gray-50">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3">Cirurgião</th>
                <th className="px-4 py-3">Procedimento</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Convênio</th>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">Valor Bruto</th>
                <th className="px-4 py-3">Custo</th>
                <th className="px-4 py-3">Lucro</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((s) => {
                const gv = s.grossValue ?? 0
                const mc = s.materialCost ?? 0
                const profit = gv - mc
                return (
                  <tr key={s.id} className="text-sm text-gray-700 hover:bg-sky-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">{new Date(s.date).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{s.time}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{s.hospital.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{s.surgeon.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{s.surgeryType.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                        {s.company.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{s.insurance}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{s.user.name}</td>
                    <td className={`px-4 py-3 whitespace-nowrap font-medium ${gv > 0 ? "text-gray-800" : "text-gray-400"}`}>
                      {gv > 0 ? `R$ ${gv.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${mc > 0 ? "text-red-600" : "text-gray-400"}`}>
                      {mc > 0 ? `R$ ${mc.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap font-medium ${profit > 0 ? "text-emerald-600" : profit < 0 ? "text-red-600" : "text-gray-400"}`}>
                      {gv > 0 ? `R$ ${profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[s.status] || "bg-gray-100 text-gray-700"}`}>
                        {statusLabel[s.status] || s.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-12 text-center text-gray-400">
                    Nenhuma cirurgia encontrada
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