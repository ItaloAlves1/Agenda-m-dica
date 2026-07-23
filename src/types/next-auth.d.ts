import "next-auth"

declare module "next-auth" {
  interface User {
    role: string
    phone?: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      phone?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    phone?: string
  }
}
