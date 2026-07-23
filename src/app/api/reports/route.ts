import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const companyName = searchParams.get("company")

  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  let where: any = {
    date: { gte: firstDay, lte: lastDay },
  }

  if (companyName) {
    where.company = { name: companyName }
  }

  if (type === "financial") {
    const surgeries = await prisma.surgery.findMany({
      where,
      include: {
        company: true,
        surgeryType: true,
        surgeon: true,
        hospital: true,
        user: true,
      },
      orderBy: { date: "asc" },
    })

    const totalGross = surgeries.reduce((acc, s) => acc + (s.grossValue ?? 0), 0)
    const totalMaterial = surgeries.reduce((acc, s) => acc + (s.materialCost ?? 0), 0)

    const byCompany = surgeries.reduce(
      (acc: any, s) => {
        const name = s.company.name
        if (!acc[name]) acc[name] = { gross: 0, material: 0, count: 0 }
        acc[name].gross += s.grossValue ?? 0
        acc[name].material += s.materialCost ?? 0
        acc[name].count++
        return acc
      },
      {} as Record<string, { gross: number; material: number; count: number }>,
    )

    return NextResponse.json({
      totalGross,
      totalMaterial,
      profit: totalGross - totalMaterial,
      byCompany,
      surgeries,
    })
  }

  if (type === "company" && companyName) {
    const company = await prisma.company.findUnique({
      where: { name: companyName },
    })

    if (!company) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 })
    }

    const surgeries = await prisma.surgery.findMany({
      where: { ...where, companyId: company.id },
      include: {
        surgeon: true,
        hospital: true,
        surgeryType: true,
        user: true,
      },
      orderBy: { date: "asc" },
    })

    let reportSurgeries = surgeries.map((s) => ({
      ...s,
      grossValue: companyName === "TITANIUM" && s.grossValue ? s.grossValue * 1.1 : s.grossValue,
      materialCost: companyName === "TITANIUM" ? 0 : s.materialCost,
    }))

    const totalGross = reportSurgeries.reduce((acc, s) => acc + (s.grossValue ?? 0), 0)
    const totalMaterial = reportSurgeries.reduce((acc, s) => acc + (s.materialCost ?? 0), 0)

    return NextResponse.json({
      company: companyName,
      totalSurgeries: reportSurgeries.length,
      totalGross,
      totalMaterial,
      profit: totalGross - totalMaterial,
      surgeries: reportSurgeries,
    })
  }

  const surgeries = await prisma.surgery.findMany({
    where,
    include: {
      hospital: true,
      surgeon: true,
      company: true,
      surgeryType: true,
      user: true,
      notifications: true,
    },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(surgeries)
}
