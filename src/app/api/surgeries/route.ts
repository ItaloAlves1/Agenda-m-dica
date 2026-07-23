import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendSurgeryConfirmation, notificationPhones } from "@/lib/whatsapp"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dashboard = searchParams.get("dashboard") === "true"
  const report = searchParams.get("report")
  const companyFilter = searchParams.get("company")
  const userId = searchParams.get("userId")

  const isAdmin = session.user.role === "ADMIN"
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  let where: any = {}
  if (!isAdmin) where.userId = session.user.id
  if (userId) where.userId = userId
  if (companyFilter) where.company = { name: companyFilter }

  if (dashboard) {
    where.date = { gte: firstDay, lte: lastDay }
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 86400000)

    const [surgeries, todayCount, totalGross, totalMaterial] = await Promise.all([
      prisma.surgery.findMany({
        where: isAdmin ? { date: { gte: firstDay, lte: lastDay } } : where,
        include: { hospital: true, surgeon: true, company: true, surgeryType: true, user: true },
        orderBy: { date: "desc" },
      }),
      prisma.surgery.count({
        where: isAdmin ? { date: { gte: todayStart, lt: todayEnd } } : { ...where, date: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.surgery.aggregate({
        where: isAdmin ? { date: { gte: firstDay, lte: lastDay } } : where,
        _sum: { grossValue: true },
      }),
      prisma.surgery.aggregate({
        where: isAdmin ? { date: { gte: firstDay, lte: lastDay } } : where,
        _sum: { materialCost: true },
      }),
    ])

    return NextResponse.json({
      totalSurgeries: surgeries.length,
      todaySurgeries: todayCount,
      totalGrossValue: totalGross._sum.grossValue ?? 0,
      totalMaterialCost: totalMaterial._sum.materialCost ?? 0,
      monthlySurgeries: surgeries,
    })
  }

  if (report === "monthly") where.date = { gte: firstDay, lte: lastDay }

  const surgeries = await prisma.surgery.findMany({
    where,
    include: { hospital: true, surgeon: true, company: true, surgeryType: true, user: true, notifications: true },
    orderBy: { date: "desc" },
  })

  return NextResponse.json(surgeries)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { date, time, insurance, grossValue, hospitalId, surgeonId, companyId, surgeryTypeId, userId } = body

    if (!date || !time || !hospitalId || !surgeonId || !companyId || !surgeryTypeId || !userId) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
    }

    const [surgeryType, company, patient] = await Promise.all([
      prisma.surgeryType.findUnique({ where: { id: parseInt(surgeryTypeId) } }),
      prisma.company.findUnique({ where: { id: parseInt(companyId) } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ])

    let materialCost = surgeryType?.materialCost ?? null
    if (company?.name === "TITANIUM") materialCost = 0

    const surgery = await prisma.surgery.create({
      data: {
        date: new Date(date),
        time,
        insurance,
        grossValue: grossValue ? parseFloat(grossValue) : null,
        materialCost,
        hospitalId: parseInt(hospitalId),
        surgeonId: parseInt(surgeonId),
        companyId: parseInt(companyId),
        surgeryTypeId: parseInt(surgeryTypeId),
        userId,
        createdById: session.user.id,
        status: "CONFIRMED",
      },
      include: { hospital: true, surgeon: true, company: true, surgeryType: true, user: true },
    })

    const dateStr = new Date(surgery.date).toLocaleDateString("pt-BR")
    const surgeryData = {
      patientName: surgery.user.name,
      surgeonName: surgery.surgeon.name,
      surgeryType: surgery.surgeryType.name,
      date: dateStr,
      time: surgery.time,
      hospital: surgery.hospital.name,
      insurance: surgery.insurance,
    }

    const allRecipients: Array<{ name: string; phone: string }> = []

    if (patient?.phone) {
      allRecipients.push({ name: patient.name, phone: patient.phone })
    }

    for (const n of notificationPhones) {
      if (!allRecipients.find((r) => r.phone === n.phone)) {
        allRecipients.push(n)
      }
    }

    const notificationResults = []
    for (const recipient of allRecipients) {
      const success = await sendSurgeryConfirmation(recipient.phone, surgeryData)

      await prisma.notificationLog.create({
        data: {
          surgeryId: surgery.id,
          phoneNumber: recipient.phone,
          type: success ? "CONFIRMATION_SENT" : "CONFIRMATION_FAILED",
        },
      })
      notificationResults.push({ name: recipient.name, phone: recipient.phone, status: success ? "sent" : "failed" })
    }

    return NextResponse.json({
      ...surgery,
      notifications: notificationResults,
    }, { status: 201 })
  } catch (error) {
    console.error("Create surgery error:", error)
    return NextResponse.json({ error: "Erro ao criar cirurgia" }, { status: 500 })
  }
}
