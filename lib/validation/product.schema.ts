import { z } from 'zod'

// Product schema (server-only). Use this when accepting product creation/updates.
export const productSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  slug: z.string().min(1, { message: 'Slug is required' }),
  description: z.string().optional(),
  price: z.number().int().nonnegative({ message: 'Price must be a non-negative integer (cents)' }),
  sku: z.string().optional(),
  stock: z.number().int().nonnegative().default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DISCONTINUED']).optional(),
})

export type ProductInput = z.infer<typeof productSchema>
