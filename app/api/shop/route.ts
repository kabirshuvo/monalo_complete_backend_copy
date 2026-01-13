import { NextResponse } from 'next/server'
import { orderSchema } from '@/lib/validation/order.schema'
import { successResponse, errorResponse } from '@/lib/validation/base-response'
import type { ZodError } from 'zod'

export async function GET() {
  // Example: fetch products from DB here (omitted)
  return NextResponse.json(successResponse({ products: [] }))
}

export async function POST(request: Request) {
  // Parse JSON body first
  const body = await request.json().catch(() => ({}))

  // Validate input using Zod (server-only)
  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) {
    const zodErr = parsed.error as ZodError
    // Return standardized error shape with validation issues
    return NextResponse.json(
      errorResponse({ message: 'Invalid request payload', issues: zodErr.errors }),
      { status: 400 }
    )
  }

  const order = parsed.data

  // IMPORTANT: No database write should happen without successful schema validation
  // At this point `order` is guaranteed to match `orderSchema`.

  // TODO: Insert order -> DB using transactions, inventory checks, etc.

  return NextResponse.json(successResponse({ order }), { status: 201 })
}
