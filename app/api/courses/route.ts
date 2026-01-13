import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthorizationError } from '@/lib/auth/role'
import { prisma } from '@/lib/db'
import { withCreatedBy } from '@/lib/auth/audit'
import { logger } from '@/lib/logger'

/**
 * GET /api/courses
 * 
 * Public endpoint to fetch all active courses
 * Returns free and paid courses available to users
 */
export async function GET(request: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      where: { deletedAt: null }, // Exclude soft-deleted courses
      select: {
        id: true,
        title: true,
        description: true,
        isPaid: true,
        price: true,
        imageUrl: true,
        createdAt: true,
        _count: {
          select: { lessons: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(courses)
  } catch (error) {
    logger.error('[GET /api/courses] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/courses
 * 
 * Protected endpoint to create a new course
 * Only ADMIN and WRITER roles can create courses
 * 
 * Required body:
 * - title: string (max 255 chars)
 * - description?: string
 * - content?: string (markdown)
 * - isPaid?: boolean (default: false)
 * - price?: number (in cents, required if isPaid: true)
 * - imageUrl?: string
 */
export async function POST(request: NextRequest) {
  try {
    // Protect route - only ADMIN and WRITER can create courses
    const session = await requireRole(['ADMIN', 'WRITER'])
    const userId = (session.user as any).id

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (body.title.length > 255) {
      return NextResponse.json(
        { error: 'Title must be 255 characters or less' },
        { status: 400 }
      )
    }

    // Validate pricing
    if (body.isPaid && !body.price) {
      return NextResponse.json(
        { error: 'Price is required for paid courses' },
        { status: 400 }
      )
    }

    // Create course with audit fields
    const course = await prisma.course.create({
      data: withCreatedBy(
        {
          title: body.title,
          description: body.description || null,
          content: body.content || null,
          isPaid: body.isPaid || false,
          price: body.price || null,
          imageUrl: body.imageUrl || null,
        },
        userId // Automatically set createdBy from session
      ),
      select: {
        id: true,
        title: true,
        description: true,
        isPaid: true,
        price: true,
        imageUrl: true,
        createdAt: true,
        createdBy: true,
      },
    })

    logger.info(`[POST /api/courses] Course created: ${course.id} by ${userId}`)

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    // Handle authorization errors
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Handle unexpected errors
    logger.error('[POST /api/courses] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
