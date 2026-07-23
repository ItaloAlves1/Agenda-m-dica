const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "http://localhost:8080"
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || ""
const TEAM_ID = parseInt(process.env.WHATSAPP_TEAM_ID || "108")
const BOT_CONFIG_ID = parseInt(process.env.WHATSAPP_BOT_CONFIG_ID || "53")
const TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || "cirurgia"

interface SurgeryData {
  patientName: string
  surgeonName: string
  surgeryType: string
  date: string
  time: string
  hospital: string
  insurance: string
}

function buildPayload(phone: string, data: SurgeryData): object {
  return {
    phone,
    team_id: TEAM_ID,
    bot_config_id: BOT_CONFIG_ID,
    template_name: TEMPLATE_NAME,
    params: [
      data.patientName,
      data.surgeonName,
      data.surgeryType,
      data.date,
      data.time,
      data.hospital,
      data.insurance,
    ],
  }
}

export async function sendWhatsAppTemplate(phoneNumber: string, data: SurgeryData): Promise<boolean> {
  if (!WHATSAPP_TOKEN) {
    console.log("\n" + "=".repeat(50))
    console.log(`📱 [WHATSAPP SIMULADO] Para: ${phoneNumber}`)
    console.log("=".repeat(50))
    console.log(JSON.stringify(buildPayload(phoneNumber, data), null, 2))
    console.log("=".repeat(50) + "\n")
    return true
  }

  const payload = buildPayload(phoneNumber, data)

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-token": WHATSAPP_TOKEN,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[WHATSAPP ERRO] Status ${response.status}: ${errorText}`)
      return false
    }

    console.log(`[WHATSAPP OK] Template enviado para ${phoneNumber}`)
    return true
  } catch (error) {
    console.error(`[WHATSAPP ERRO] Falha ao enviar para ${phoneNumber}:`, error)
    return false
  }
}

export async function sendSurgeryConfirmation(phoneNumber: string, data: SurgeryData): Promise<boolean> {
  return sendWhatsAppTemplate(phoneNumber, data)
}

export async function sendVesperReminder(phoneNumber: string, data: SurgeryData): Promise<boolean> {
  return sendWhatsAppTemplate(phoneNumber, data)
}

export async function sendTwoHourAlert(phoneNumber: string, data: SurgeryData): Promise<boolean> {
  return sendWhatsAppTemplate(phoneNumber, data)
}

export { notificationPhones } from "./data"
