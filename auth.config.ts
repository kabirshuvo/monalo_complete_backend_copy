import type { NextAuthOptions } from 'next-auth'
import type { Session } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { loginSchema } from '@/lib/validation/auth.schema'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth-helpers'
import { getAuthCallbacks } from '@/lib/auth/callbacks'
import { Role } from '@prisma/client'

const authConfig: NextAuthOptions = {
  // Use Prisma adapter for database-backed sessions
  adapter: PrismaAdapter(prisma),
  // Database-backed sessions (persisted in DB via adapter)
  session: {
    strategy: 'database',
    // Session expiration: 30 days
    maxAge: 30 * 24 * 60 * 60,
    // Update session every 24 hours
    updateAge: 24 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate input using Zod schema on the server before any DB work
        // This prevents malformed or unexpected data from reaching downstream logic
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
          // Throw an explicit error with validation messages so NextAuth can surface it
          const messages = parsed.error.errors.map((e) => e.message).join('; ')
          throw new Error(`Invalid credentials: ${messages}`)
        }

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email: email as string },
          select: {
            id: true,
            email: true,
            username: true,
            password: true,
            role: true,
          },
        })

        if (!user || !user.password) {
          throw new Error('User not found or not registered with password')
        }

        const isPasswordValid = await verifyPassword(password as string, user.password)
        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          role: user.role || Role.CUSTOMER,
        }
      },
    }),
  ],
  pages: {
    signIn: '/(auth)/login',
    newUser: '/(auth)/register',
  },
  callbacks: getAuthCallbacks(),
}

export default authConfig
