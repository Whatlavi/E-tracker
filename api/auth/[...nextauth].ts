import NextAuth, { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  providers: [], // Sin providers aún
  secret: process.env.NEXTAUTH_SECRET || "MI_SECRET_TEMPORAL",
}

export default NextAuth(authOptions)
