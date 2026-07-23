import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendSurgeryConfirmation, notificationPhones } from "@/lib/whatsapp"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { surgeryId } = await req.json()

    const surgery = await prisma.surgery.findUnique({
      where: { id: surgeryId },
      include: {
        hospital: true,
        surgeon: true,
        company: true,
        surgeryType: true,
        user: true,
      },
    })

    if (!surgery) {
      return NextResponse.json({ error: "Cirurgia não encontrada" }, { status: 404 })
    }

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

    const results = []

    for (const phone of notificationPhones) {
      const success = await sendSurgeryConfirmation(phone.phone, surgeryData)

      await prisma.notificationLog.create({
        data: {
          surgeryId: surgery.id,
          phoneNumber: phone.phone,
          type: success ? "CONFIRMATION_SENT" : "CONFIRMATION_FAILED",
        },
      })

      results.push({
        phone: phone.name,
        number: phone.phone,
        status: success ? "sent" : "failed",
      })
    }

    return NextResponse.json({
      success: true,
      message: "Notificações enviadas",
      results,
    })
  } catch (error) {
    console.error("Notification error:", error)
    return NextResponse.json({ error: "Erro ao enviar notificações" }, { status: 500 })
  }
}
