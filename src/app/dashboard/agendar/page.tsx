"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface SelectOption { id: number; name: string }
interface SurgeryTypeOption extends SelectOption { materialCost: number | null; suggestedGrossValue: number | null }
interface UserOption { id: string; name: string; email: string; phone: string | null }

function normalize(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

export default function AgendarPage() {
  const router = useRouter()
  const [hospitals, setHospitals] = useState<SelectOption[]>([])
  const [surgeons, setSurgeons] = useState<SelectOption[]>([])
  const [companies, setCompanies] = useState<SelectOption[]>([])
  const [surgeryTypes, setSurgeryTypes] = useState<SurgeryTypeOption[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showPaste, setShowPaste] = useState(false)
  const [pasteText, setPasteText] = useState("")
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [newPatient, setNewPatient] = useState({ name: "", phone: "" })
  const [savingPatient, setSavingPatient] = useState(false)

  const [form, setForm] = useState({
    date: "", time: "", insurance: "", grossValue: "",
    hospitalId: "", surgeonId: "", companyId: "", surgeryTypeId: "", userId: "",
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/surgeries/select?type=hospitals").then((r) => r.json()),
      fetch("/api/surgeries/select?type=surgeons").then((r) => r.json()),
      fetch("/api/surgeries/select?type=companies").then((r) => r.json()),
      fetch("/api/surgeries/select?type=surgeryTypes").then((r) => r.json()),
      fetch("/api/surgeries/select?type=users").then((r) => r.json()),
    ]).then(([h, s, c, st, u]) => {
      setHospitals(h); setSurgeons(s); setCompanies(c); setSurgeryTypes(st); setUsers(u)
    })
  }, [])

  function handlePaste() {
    const lines = pasteText.split("\n").map((l) => l.trim()).filter(Boolean)
    const parsed: Record<string, string> = {}

    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.+)$/)
      if (match) {
        const key = normalize(match[1])
        const value = match[2].trim()
        parsed[key] = value
      }
    }

    const newForm = { ...form }

    if (parsed["paciente"]) {
      const user = users.find((u) => normalize(u.name).includes(normalize(parsed["paciente"])))
      if (user) newForm.userId = user.id
    }

    if (parsed["cirurgiao"]) {
      const surgeon = surgeons.find((s) => normalize(s.name).includes(normalize(parsed["cirurgiao"])))
      if (surgeon) newForm.surgeonId = String(surgeon.id)
    }

    if (parsed["procedimento"]) {
      const st = surgeryTypes.find((st) => normalize(st.name).includes(normalize(parsed["procedimento"])))
      if (st) {
        newForm.surgeryTypeId = String(st.id)
        if (st.suggestedGrossValue) newForm.grossValue = String(st.suggestedGrossValue)
      }
    }

    if (parsed["hospital"]) {
      const h = hospitals.find((h) => normalize(h.name).includes(normalize(parsed["hospital"])))
      if (h) newForm.hospitalId = String(h.id)
    }

    if (parsed["empresa"]) {
      const c = companies.find((c) => normalize(c.name).includes(normalize(parsed["empresa"])))
      if (c) newForm.companyId = String(c.id)
    }

    if (parsed["convenio"]) {
      newForm.insurance = parsed["convenio"]
    }

    if (parsed["data"]) {
      const d = parsed["data"].replace(/\./g, "/")
      const parts = d.split("/")
      if (parts.length === 3) {
        newForm.date = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`
      }
    }

    if (parsed["horario"]) {
      newForm.time = parsed["horario"].substring(0, 5)
    }

    setForm(newForm)
    setShowPaste(false)
    setPasteText("")
  }

  async function handleCreatePatient() {
    if (!newPatient.name.trim()) return
    setSavingPatient(true)
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPatient.name.trim(), phone: newPatient.phone.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erro ao criar paciente"); setSavingPatient(false); return }
      const updated = await fetch("/api/surgeries/select?type=users").then((r) => r.json())
      setUsers(updated)
      setForm((prev) => ({ ...prev, userId: data.id }))
      setShowNewPatient(false)
      setNewPatient({ name: "", phone: "" })
    } catch { setError("Erro ao criar paciente") }
    finally { setSavingPatient(false) }
  }

  function handleSurgeryTypeChange(id: string) {
    const st = surgeryTypes.find((st) => String(st.id) === id)
    setForm((prev) => ({
      ...prev,
      surgeryTypeId: id,
      grossValue: st?.suggestedGrossValue ? String(st.suggestedGrossValue) : prev.grossValue,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(""); setSuccess(false)

    try {
      const res = await fetch("/api/surgeries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erro ao agendar"); setLoading(false); return }

      setSuccess(true)
      setForm({ date: "", time: "", insurance: "", grossValue: "", hospitalId: "", surgeonId: "", companyId: "", surgeryTypeId: "", userId: "" })

      setTimeout(() => router.push("/dashboard"), 2500)
    } catch { setError("Erro ao conectar com o servidor") }
    finally { setLoading(false) }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Agendar Cirurgia</h1>
        <p className="text-sm text-gray-500 mt-1">Preencha os dados para agendar</p>
      </div>

      {success && (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-200 flex items-center gap-2">
          <span>✅</span> Cirurgia agendada com sucesso! Mensagens WhatsApp enviadas.
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200 flex items-center gap-2">
          <span>❌</span> {error}
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={() => setShowPaste(!showPaste)}
          className="rounded-lg border border-dashed border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 transition-all">
          📋 Colar texto para preenchimento automático
        </button>
      </div>

      {showPaste && (
        <div className="card p-6 space-y-4 border-sky-200">
          <p className="text-sm text-gray-600">Cole o texto com os dados da cirurgia abaixo. O sistema preencherá automaticamente.</p>
          <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm min-h-[160px]"
            placeholder={`Paciente: Rodrigo Alves Braga\nCirurgião: Renato Carvalho\nProcedimento: Tumor Cerebral\nHospital: Hbento\nConvênio: MT Siasp\nData: 25.07.2026\nHorário: 07:00`} />
          <div className="flex gap-3">
            <button type="button" onClick={handlePaste} disabled={!pasteText.trim()}
              className="btn-primary text-sm">⚡ Preencher Formulário</button>
            <button type="button" onClick={() => { setShowPaste(false); setPasteText("") }}
              className="btn-secondary text-sm">Cancelar</button>
          </div>
        </div>
      )}

      {showNewPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card w-full max-w-md p-6 space-y-5">
            <h3 className="text-lg font-semibold text-gray-800">Novo Paciente</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input type="text" required value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="Nome completo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input type="text" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="(65) 99999-9999" />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={handleCreatePatient} disabled={savingPatient || !newPatient.name.trim()}
                className="btn-primary text-sm">{savingPatient ? "Salvando..." : "Salvar Paciente"}</button>
              <button type="button" onClick={() => { setShowNewPatient(false); setNewPatient({ name: "", phone: "" }) }}
                className="btn-secondary text-sm">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
            <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Local da Cirurgia</label>
            <select required value={form.hospitalId} onChange={(e) => setForm({ ...form, hospitalId: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              <option value="">Selecione...</option>
              {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cirurgião</label>
            <select required value={form.surgeonId} onChange={(e) => setForm({ ...form, surgeonId: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              <option value="">Selecione...</option>
              {surgeons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
            <select required value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              <option value="">Selecione...</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Procedimento</label>
            <select required value={form.surgeryTypeId} onChange={(e) => handleSurgeryTypeChange(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
              <option value="">Selecione...</option>
              {surgeryTypes.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
            <div className="flex gap-2">
              <select required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
                <option value="">Selecione...</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} - {u.phone || u.email}</option>)}
              </select>
              <button type="button" onClick={() => setShowNewPatient(true)}
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg border border-sky-300 bg-sky-50 text-lg text-sky-600 hover:bg-sky-100 transition-all"
                title="Novo Paciente">+</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Convênio</label>
            <input type="text" required value={form.insurance} onChange={(e) => setForm({ ...form, insurance: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="Ex: Unimed, Porto Seguro..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Bruto (R$)</label>
            <input type="number" step="0.01" value={form.grossValue} onChange={(e) => setForm({ ...form, grossValue: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" placeholder="0,00" />
          </div>
        </div>
        <div className="flex gap-4 pt-2">
          <button type="submit" disabled={loading} className="btn-primary text-sm">
            {loading ? "Agendando..." : "📅 Agendar Cirurgia"}
          </button>
          <button type="button" onClick={() => router.push("/dashboard")} className="btn-secondary text-sm">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
