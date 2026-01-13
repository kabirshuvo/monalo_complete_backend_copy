import { z } from 'zod'

// Zod schema for credentials-based login
// This schema is used on the server during authentication only.
export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
})

export type LoginInput = z.infer<typeof loginSchema>

// Pattern: export a Zod schema and a TypeScript type.
// Use `safeParse()` or `parse()` in server code to validate inputs before any DB writes.
