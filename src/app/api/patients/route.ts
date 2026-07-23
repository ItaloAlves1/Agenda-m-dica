import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { name, phone } = await req.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    const emailSlug = name.trim().toLowerCase().replace(/\s+/g, "")

    const existing = await prisma.user.findUnique({ where: { email: emailSlug } })
    if (existing) {
      return NextResponse.json({ error: "Já existe um paciente com esse nome" }, { status: 400 })
    }

    const password = await hash(phone ? phone.replace(/\D/g, "").slice(-6) : "123456", 10)

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailSlug,
        password,
        phone: phone || null,
        role: "USER",
      },
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    }, { status: 201 })
  } catch (error) {
    console.error("Create patient error:", error)
    return NextResponse.json({ error: "Erro ao criar paciente" }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const patients = await prisma.user.findMany({
    where: { role: "USER" },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(patients)
}
