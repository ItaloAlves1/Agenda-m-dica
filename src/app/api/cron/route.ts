import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendVesperReminder, sendTwoHourAlert } from "@/lib/whatsapp"

export async function GET() {
  try {
    const now = new Date()

    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const tomorrowEnd = new Date(tomorrow)
    tomorrowEnd.setHours(23, 59, 59, 999)

    const vesperSurgeries = await prisma.surgery.findMany({
      where: {
        date: { gte: tomorrow, lte: tomorrowEnd },
        notifiedVesper: false,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      include: { hospital: true, surgeon: true, surgeryType: true, user: true },
    })

    let vesperSent = 0
    for (const surgery of vesperSurgeries) {
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

      const phones: string[] = []
      if (surgery.user.phone) phones.push(surgery.user.phone)

      for (const phone of phones) {
        await sendVesperReminder(phone, surgeryData)
        vesperSent++
      }

      await prisma.surgery.update({
        where: { id: surgery.id },
        data: { notifiedVesper: true },
      })
    }

    const nowPlus2h = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const alertSurgeries = await prisma.surgery.findMany({
      where: {
        date: { gte: now, lte: nowPlus2h },
        notified2hBefore: false,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
      include: { hospital: true, surgeon: true, surgeryType: true, user: true },
    })

    let alertSent = 0
    for (const surgery of alertSurgeries) {
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

      const phones: string[] = []
      if (surgery.user.phone) phones.push(surgery.user.phone)

      for (const phone of phones) {
        await sendTwoHourAlert(phone, surgeryData)
        alertSent++
      }

      await prisma.surgery.update({
        where: { id: surgery.id },
        data: { notified2hBefore: true },
      })
    }

    return NextResponse.json({ vesperSent, alertSent })
  } catch (error) {
    console.error("Scheduler error:", error)
    return NextResponse.json({ error: "Erro no agendador" }, { status: 500 })
  }
}
