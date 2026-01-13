import { z } from 'zod'

// Order schemas used by `app/api/shop/route.ts` — server-only
export const orderItemSchema = z.object({
  productId: z.string().min(1, { message: 'productId is required' }),
  quantity: z.number().int().min(1, { message: 'quantity must be at least 1' }),
})

export const orderSchema = z.object({
  userId: z.string().optional(),
  items: z.array(orderItemSchema).min(1, { message: 'At least one order item is required' }),
  shippingAddress: z.string().optional(),
  paymentMethod: z.string().optional(),
})

export type OrderInput = z.infer<typeof orderSchema>
