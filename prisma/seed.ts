import { PrismaClient } from '@prisma/client'
import { addDays, subDays } from 'date-fns'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding ChaseFlow database...')

  // Clear existing data
  await prisma.reminder.deleteMany()
  await prisma.lineItem.deleteMany()
  await prisma.invoice.deleteMany()

  const now = new Date()

  // ─── Invoice 1: Paid ───────────────────────────────────────────────
  const invoice1 = await prisma.invoice.create({
    data: {
      clientName: 'Acme Corp',
      clientEmail: 'billing@acmecorp.com',
      title: 'Website Redesign Phase 1',
      currency: 'INR',
      status: 'paid',
      dueDate: subDays(now, 10),
      publicSlug: nanoid(10),
      notes: 'Payment received via bank transfer. Thank you for your prompt payment.',
      lineItems: {
        create: [
          {
            description: 'UI/UX Design & Wireframes',
            quantity: 1,
            unitPrice: 35000,
            amount: 35000,
          },
          {
            description: 'Frontend Development (React)',
            quantity: 1,
            unitPrice: 40000,
            amount: 40000,
          },
          {
            description: 'Quality Assurance & Testing',
            quantity: 1,
            unitPrice: 10000,
            amount: 10000,
          },
        ],
      },
      reminders: {
        create: [
          {
            subject: 'Friendly Reminder: Invoice for Website Redesign Phase 1',
            body: 'Hi Acme Corp,\n\nI hope this message finds you well. This is a gentle reminder that the invoice for Website Redesign Phase 1 (₹85,000) is approaching its due date. Please let us know if you have any questions.\n\nBest regards,\nChaseFlow',
            scheduledDate: subDays(now, 17),
            status: 'sent',
            tone: 'friendly',
            sendOrder: 1,
            sentAt: subDays(now, 17),
          },
          {
            subject: 'Follow-up: Payment Due for Website Redesign Phase 1',
            body: 'Hi Acme Corp,\n\nWe wanted to follow up regarding the outstanding invoice for Website Redesign Phase 1 (₹85,000). The payment was due recently, and we\'d appreciate it if you could arrange the transfer at your earliest convenience.\n\nPlease let us know if there are any issues.\n\nThank you,\nChaseFlow',
            scheduledDate: subDays(now, 13),
            status: 'sent',
            tone: 'firm',
            sendOrder: 2,
            sentAt: subDays(now, 13),
          },
          {
            subject: 'Final Notice: Overdue Payment for Website Redesign Phase 1',
            body: 'Dear Acme Corp,\n\nThis is a final reminder regarding the overdue payment for Website Redesign Phase 1 (₹85,000). We kindly request immediate payment to avoid any disruption to our ongoing collaboration.\n\nIf payment has already been made, please disregard this notice.\n\nRegards,\nChaseFlow',
            scheduledDate: subDays(now, 11),
            status: 'sent',
            tone: 'final',
            sendOrder: 3,
            sentAt: subDays(now, 11),
          },
        ],
      },
    },
  })
  console.log(`  ✅ Created paid invoice: ${invoice1.title}`)

  // ─── Invoice 2: Overdue ────────────────────────────────────────────
  const invoice2 = await prisma.invoice.create({
    data: {
      clientName: 'Stark Industries',
      clientEmail: 'accounts@starkindustries.io',
      title: 'API Integration Sprint',
      currency: 'INR',
      status: 'overdue',
      dueDate: subDays(now, 5),
      publicSlug: nanoid(10),
      notes: 'Includes REST API development and third-party service integration.',
      lineItems: {
        create: [
          {
            description: 'REST API Design & Development',
            quantity: 1,
            unitPrice: 75000,
            amount: 75000,
          },
          {
            description: 'Third-party API Integration & Testing',
            quantity: 1,
            unitPrice: 45000,
            amount: 45000,
          },
        ],
      },
      reminders: {
        create: [
          {
            subject: 'Reminder: Invoice for API Integration Sprint',
            body: 'Hi Stark Industries,\n\nThis is a friendly reminder that the invoice for API Integration Sprint (₹1,20,000) is due shortly. We\'d appreciate your timely payment.\n\nIf you have any questions about the invoice, feel free to reach out.\n\nBest regards,\nChaseFlow',
            scheduledDate: subDays(now, 12),
            status: 'sent',
            tone: 'friendly',
            sendOrder: 1,
            sentAt: subDays(now, 12),
          },
          {
            subject: 'Urgent: Overdue Payment for API Integration Sprint',
            body: 'Hi Stark Industries,\n\nOur records indicate that the invoice for API Integration Sprint (₹1,20,000) is now past due. We request that you process the payment at your earliest convenience to avoid further escalation.\n\nPlease contact us if there is an issue with the payment.\n\nThank you,\nChaseFlow',
            scheduledDate: subDays(now, 7),
            status: 'sent',
            tone: 'firm',
            sendOrder: 2,
            sentAt: subDays(now, 7),
          },
          {
            subject: 'Final Notice: Immediate Payment Required - API Integration Sprint',
            body: 'Dear Stark Industries,\n\nThis is our final notice regarding the overdue invoice for API Integration Sprint (₹1,20,000). The payment is now significantly past due, and we must insist on immediate settlement.\n\nFailure to remit payment within 48 hours may result in suspension of services and potential escalation to our collections team.\n\nPlease treat this as a matter of urgency.\n\nRegards,\nChaseFlow',
            scheduledDate: addDays(now, 1),
            status: 'pending',
            tone: 'final',
            sendOrder: 3,
          },
        ],
      },
    },
  })
  console.log(`  ✅ Created overdue invoice: ${invoice2.title}`)

  // ─── Invoice 3: Sent ──────────────────────────────────────────────
  const invoice3 = await prisma.invoice.create({
    data: {
      clientName: 'Wayne Enterprises',
      clientEmail: 'finance@wayneenterprises.com',
      title: 'Mobile App Prototype',
      currency: 'INR',
      status: 'sent',
      dueDate: addDays(now, 7),
      publicSlug: nanoid(10),
      notes: 'Cross-platform mobile application prototype with native performance.',
      lineItems: {
        create: [
          {
            description: 'Product Strategy & Requirements Analysis',
            quantity: 1,
            unitPrice: 30000,
            amount: 30000,
          },
          {
            description: 'Mobile UI/UX Design (iOS & Android)',
            quantity: 1,
            unitPrice: 60000,
            amount: 60000,
          },
          {
            description: 'React Native Development',
            quantity: 1,
            unitPrice: 120000,
            amount: 120000,
          },
          {
            description: 'App Store Submission & DevOps Setup',
            quantity: 1,
            unitPrice: 40000,
            amount: 40000,
          },
        ],
      },
      reminders: {
        create: [
          {
            subject: 'Reminder: Invoice for Mobile App Prototype',
            body: 'Hi Wayne Enterprises,\n\nThis is a friendly reminder that the invoice for Mobile App Prototype (₹2,50,000) is due in a few days. We\'d greatly appreciate timely payment so we can continue delivering great work.\n\nPlease don\'t hesitate to reach out if you have any questions.\n\nWarm regards,\nChaseFlow',
            scheduledDate: addDays(now, 5),
            status: 'pending',
            tone: 'friendly',
            sendOrder: 1,
          },
          {
            subject: 'Follow-up: Payment Due for Mobile App Prototype',
            body: 'Hi Wayne Enterprises,\n\nWe\'re writing to follow up on the invoice for Mobile App Prototype (₹2,50,000). The due date is approaching, and we want to ensure there are no delays in processing.\n\nKindly confirm receipt and expected payment date.\n\nThank you,\nChaseFlow',
            scheduledDate: addDays(now, 8),
            status: 'pending',
            tone: 'firm',
            sendOrder: 2,
          },
          {
            subject: 'Final Reminder: Overdue Payment - Mobile App Prototype',
            body: 'Dear Wayne Enterprises,\n\nThis is a final reminder that the invoice for Mobile App Prototype (₹2,50,000) remains unpaid. We kindly request immediate payment to maintain our service agreement.\n\nIf payment has already been initiated, please share the transaction reference so we can update our records.\n\nRegards,\nChaseFlow',
            scheduledDate: addDays(now, 14),
            status: 'pending',
            tone: 'final',
            sendOrder: 3,
          },
        ],
      },
    },
  })
  console.log(`  ✅ Created sent invoice: ${invoice3.title}`)

  // ─── Invoice 4: Draft ─────────────────────────────────────────────
  const invoice4 = await prisma.invoice.create({
    data: {
      clientName: 'Oscorp',
      clientEmail: 'procurement@oscorp.net',
      title: 'Cloud Migration Consulting',
      currency: 'INR',
      status: 'draft',
      dueDate: addDays(now, 14),
      publicSlug: nanoid(10),
      notes: 'Consulting engagement for AWS cloud migration strategy and execution.',
      lineItems: {
        create: [
          {
            description: 'Cloud Architecture Assessment & Planning',
            quantity: 1,
            unitPrice: 25000,
            amount: 25000,
          },
          {
            description: 'Migration Execution & Support (2 weeks)',
            quantity: 1,
            unitPrice: 20000,
            amount: 20000,
          },
        ],
      },
      reminders: {
        create: [
          {
            subject: 'Reminder: Invoice for Cloud Migration Consulting',
            body: 'Hi Oscorp,\n\nThis is a friendly heads-up that the invoice for Cloud Migration Consulting (₹45,000) will be due soon. We hope the migration project is going smoothly!\n\nPlease let us know if you need any additional documentation for processing.\n\nBest,\nChaseFlow',
            scheduledDate: addDays(now, 12),
            status: 'pending',
            tone: 'friendly',
            sendOrder: 1,
          },
          {
            subject: 'Follow-up: Payment for Cloud Migration Consulting',
            body: 'Hi Oscorp,\n\nJust following up on the invoice for Cloud Migration Consulting (₹45,000). The due date is coming up, and we\'d appreciate confirmation that payment is being processed.\n\nLet us know if you need anything from our end.\n\nThank you,\nChaseFlow',
            scheduledDate: addDays(now, 16),
            status: 'pending',
            tone: 'firm',
            sendOrder: 2,
          },
          {
            subject: 'Final Notice: Payment Required - Cloud Migration Consulting',
            body: 'Dear Oscorp,\n\nThis is a final notice regarding the invoice for Cloud Migration Consulting (₹45,000). Payment has not yet been received, and we must request immediate settlement.\n\nPlease process the payment promptly or contact us to discuss any concerns.\n\nRegards,\nChaseFlow',
            scheduledDate: addDays(now, 21),
            status: 'pending',
            tone: 'final',
            sendOrder: 3,
          },
        ],
      },
    },
  })
  console.log(`  ✅ Created draft invoice: ${invoice4.title}`)

  console.log('\n🎉 Seed completed! Created 4 invoices with line items and reminders.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
