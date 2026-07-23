import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { surgeryTypeCosts } from "@/lib/data"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  switch (type) {
    case "hospitals": {
      const data = await prisma.hospital.findMany({ orderBy: { name: "asc" } })
      return NextResponse.json(data)
    }
    case "surgeons": {
      const data = await prisma.surgeon.findMany({ orderBy: { name: "asc" } })
      return NextResponse.json(data)
    }
    case "companies": {
      const data = await prisma.company.findMany({ orderBy: { name: "asc" } })
      return NextResponse.json(data)
    }
    case "surgeryTypes": {
      const data = await prisma.surgeryType.findMany({ orderBy: { name: "asc" } })
      const enriched = data.map((st) => ({
        ...st,
        suggestedGrossValue: surgeryTypeCosts[st.name] ?? null,
      }))
      return NextResponse.json(enriched)
    }
    case "users": {
      const data = await prisma.user.findMany({
        where: { role: "USER" },
        select: { id: true, name: true, email: true, phone: true },
        orderBy: { name: "asc" },
      })
      return NextResponse.json(data)
    }
    default:
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
  }
}
