import "dotenv/config"
import { hash } from "bcryptjs"
import { PrismaClient } from "../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { hospitals, surgeons, companies, surgeryTypes, notificationPhones } from "./data"

const connectionString = process.env.DATABASE_URL || ""
const adapter = new PrismaPg({
  connectionString,
  ssl: connectionString.includes("supabase") ? { rejectUnauthorized: false } : undefined,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminPassword = await hash("superadmin", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin" },
    update: {},
    create: {
      email: "admin",
      name: "Administrador",
      password: adminPassword,
      role: "ADMIN",
    },
  })
  console.log("Admin criado:", admin.email, "/ senha: superadmin")

  for (const phone of notificationPhones) {
    const userPassword = await hash(phone.phone.slice(-6), 10)
    const emailSlug = phone.name.toLowerCase().replace(/\s+/g, "")
    await prisma.user.upsert({
      where: { email: emailSlug },
      update: {},
      create: {
        email: emailSlug,
        name: phone.name,
        password: userPassword,
        phone: phone.phone,
        role: "USER",
      },
    })
    console.log("Usuário:", phone.name, "->", emailSlug)
  }

  for (const name of hospitals) {
    await prisma.hospital.upsert({ where: { name }, update: {}, create: { name } })
  }
  console.log("Hospitais:", hospitals.length)

  for (const name of surgeons) {
    await prisma.surgeon.upsert({ where: { name }, update: {}, create: { name } })
  }
  console.log("Cirurgiões:", surgeons.length)

  for (const name of companies) {
    await prisma.company.upsert({ where: { name }, update: {}, create: { name } })
  }
  console.log("Empresas:", companies.length)

  for (const st of surgeryTypes) {
    await prisma.surgeryType.upsert({
      where: { name: st.name },
      update: {},
      create: { name: st.name, materialCost: st.materialCost },
    })
  }
  console.log("Tipos de cirurgia:", surgeryTypes.length)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
