import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth-helpers'
import { setupPrismaShutdown } from '../lib/prisma-cleanup'
import { logger } from '../lib/logger'

const prisma = new PrismaClient()

// Set up graceful shutdown handlers
setupPrismaShutdown(prisma, {
  logger: {
    log: (msg: string) => logger.info(msg),
    error: (msg: string) => logger.error(msg),
  },
})

async function main() {
  logger.info('🌱 Starting database seed...')

  // ============= Create Users =============
  logger.info('\n📝 Creating users...')

  const adminPassword = await hashPassword('admin123')
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true,
      level: 10,
      points: 5000,
    },
  })
  logger.info(`✓ Admin user: ${admin.email}`)

  const customerPassword = await hashPassword('customer123')
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      username: 'customer',
      password: customerPassword,
      role: 'CUSTOMER',
      isVerified: true,
      level: 2,
      points: 120,
    },
  })
  logger.info(`✓ Customer user: ${customer.email}`)

  const learnerPassword = await hashPassword('learner123')
  const learner = await prisma.user.upsert({
    where: { email: 'learner@example.com' },
    update: {},
    create: {
      email: 'learner@example.com',
      username: 'learner',
      password: learnerPassword,
      role: 'LEARNER',
      isVerified: true,
      level: 3,
      points: 250,
    },
  })
  logger.info(`✓ Learner user: ${learner.email}`)

  // ============= Create Courses =============
  logger.info('\n🎓 Creating courses...')

  const freeCourse = await prisma.course.upsert({
    where: { id: 'course-free-intro' },
    update: {},
    create: {
      id: 'course-free-intro',
      title: 'Introduction to Web Development',
      description:
        'Learn the basics of HTML, CSS, and JavaScript. Perfect for beginners with no prior experience.',
      content: `
# Course Outline

## Module 1: HTML Basics
- What is HTML?
- HTML Structure
- Common HTML Tags
- Creating Your First Web Page

## Module 2: CSS Styling
- Introduction to CSS
- Selectors and Properties
- Box Model
- Responsive Design Basics

## Module 3: JavaScript Fundamentals
- JavaScript Syntax
- Variables and Data Types
- Functions and Events
- DOM Manipulation

## Course Projects
- Build a Personal Portfolio Website
- Create an Interactive To-Do List
- Develop a Simple Calculator

## Resources
- Recommended tools and extensions
- Further learning materials
- Community support
      `,
    },
  })
  logger.info(`✓ Free course: "${freeCourse.title}"`)

  const paidCourse = await prisma.course.upsert({
    where: { id: 'course-paid-advanced' },
    update: {},
    create: {
      id: 'course-paid-advanced',
      title: 'Advanced React & Next.js Masterclass',
      description:
        'Master modern web development with React, Next.js, TypeScript, and TailwindCSS. Build production-ready applications.',
      content: `
# Advanced Course Outline

## Module 1: React Advanced Patterns
- Hooks Deep Dive (useContext, useReducer, custom hooks)
- Performance Optimization
- Code Splitting and Lazy Loading
- Error Boundaries

## Module 2: Next.js Production Patterns
- App Router Architecture
- Server Components & Actions
- API Routes & Middleware
- Deployment Strategies

## Module 3: Full-Stack Development
- Database Integration (Prisma)
- Authentication & Authorization
- Real-time Features with WebSockets
- Caching Strategies

## Module 4: Testing & DevOps
- Unit Testing with Vitest
- E2E Testing with Playwright
- CI/CD Pipelines
- Docker & Container Deployment

## Capstone Project
- Build a Multi-Tenant SaaS Application
- Deploy to Vercel with custom domain
- Implement real-time analytics
- Set up monitoring and logging

## Bonus: Industry Best Practices
- Code review processes
- Technical debt management
- Architecture decisions
- Team collaboration tools
      `,
    },
  })
  logger.info(`✓ Paid course: "${paidCourse.title}"`)

  // ============= Create Products =============
  logger.info('\n🛍️  Creating shop products...')

  const product1 = await prisma.product.upsert({
    where: { id: 'product-nextjs-handbook' },
    update: {},
    create: {
      id: 'product-nextjs-handbook',
      name: 'Next.js Developer Handbook',
      slug: 'nextjs-developer-handbook',
      description:
        'Comprehensive guide covering App Router, API Routes, optimizations, and deployment strategies for modern Next.js applications.',
      price: 2999, // $29.99 in cents
      stock: 100,
      status: 'ACTIVE',
      imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134ef2944f1?w=400&h=400&fit=crop',
    },
  })
  logger.info(`✓ Product 1: "${product1.name}" - $${(product1.price / 100).toFixed(2)}`)

  const product2 = await prisma.product.upsert({
    where: { id: 'product-typescript-course' },
    update: {},
    create: {
      id: 'product-typescript-course',
      name: 'TypeScript Mastery Course',
      slug: 'typescript-mastery-course',
      description:
        'Learn TypeScript from zero to hero. Covers types, interfaces, generics, decorators, and advanced patterns used in production apps.',
      price: 3999, // $39.99 in cents
      stock: 150,
      status: 'ACTIVE',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop',
    },
  })
  logger.info(`✓ Product 2: "${product2.name}" - $${(product2.price / 100).toFixed(2)}`)

  const product3 = await prisma.product.upsert({
    where: { id: 'product-devtools-bundle' },
    update: {},
    create: {
      id: 'product-devtools-bundle',
      name: 'Modern DevTools Bundle',
      slug: 'modern-devtools-bundle',
      description:
        'Premium bundle including VSCode extensions, CLI tools, and development utilities to boost your productivity by 10x.',
      price: 4999, // $49.99 in cents
      stock: 75,
      status: 'ACTIVE',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop',
    },
  })
  logger.info(`✓ Product 3: "${product3.name}" - $${(product3.price / 100).toFixed(2)}`)

  // ============= Create Points Rules =============
  logger.info('\n⭐ Creating points rules...')

  const pointsRules = [
    { id: 'rule-signup', action: 'signup', points: 100 },
    { id: 'rule-course', action: 'course_completion', points: 500 },
    { id: 'rule-purchase', action: 'product_purchase', points: 200 },
    { id: 'rule-blog', action: 'blog_post', points: 300 },
    { id: 'rule-referral', action: 'referral', points: 1000 },
  ]

  for (const rule of pointsRules) {
    await prisma.pointsRule.upsert({
      where: { action: rule.action },
      update: {},
      create: rule,
    })
  }
  logger.info(`✓ Created ${pointsRules.length} points rules`)

  // ============= Summary =============
  logger.info('\n✅ Seed completed successfully!')
  logger.info('\n📊 Summary:')
  logger.info(`  - Users: 3 (1 Admin, 1 Customer, 1 Learner)`) 
  logger.info(`  - Courses: 2 (1 Free, 1 Paid)`) 
  logger.info(`  - Products: 3`) 
  logger.info(`  - Points Rules: ${pointsRules.length}`)
  logger.info('\n🔐 Test Credentials:')
  logger.info('  Admin: admin@example.com / admin123')
  logger.info('  Customer: customer@example.com / customer123')
  logger.info('  Learner: learner@example.com / learner123')
}

main()
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('🔴 Seed failed:', message)
    if (err instanceof Error && err.stack) {
      logger.error(err.stack)
    }
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

