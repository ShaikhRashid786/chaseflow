import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

const server = new Server(
  { name: 'chaseflow-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'create_invoice',
    description:
      'Create a new invoice with line items and an automated reminder/chase sequence. The invoice will be accessible via a public link for the client to view.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        client_name: {
          type: 'string',
          description: 'Name of the client or company being invoiced',
        },
        client_email: {
          type: 'string',
          description: "Client's email address for reminders",
        },
        title: {
          type: 'string',
          description: 'Invoice title or project description',
        },
        currency: {
          type: 'string',
          enum: ['INR', 'USD', 'EUR', 'GBP'],
          default: 'INR',
          description: 'Currency code',
        },
        due_date: {
          type: 'string',
          description: 'Due date in ISO format (YYYY-MM-DD)',
        },
        notes: {
          type: 'string',
          description: 'Additional notes for the invoice',
        },
        line_items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              quantity: { type: 'number', default: 1 },
              unit_price: { type: 'number' },
            },
            required: ['description', 'unit_price'],
          },
          description: 'List of billable items',
        },
        reminders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subject: { type: 'string', description: 'Email subject line' },
              body: { type: 'string', description: 'Email body text' },
              days_offset: {
                type: 'number',
                description:
                  'Days relative to due date (negative = before, positive = after). E.g., -3 means 3 days before due date.',
              },
              tone: {
                type: 'string',
                enum: ['friendly', 'firm', 'final'],
              },
            },
            required: ['subject', 'body', 'days_offset', 'tone'],
          },
          description:
            'Sequence of reminder emails to chase payment. Each gets a scheduled date based on days_offset from due_date.',
        },
      },
      required: ['client_name', 'title', 'due_date', 'line_items', 'reminders'],
    },
  },
  {
    name: 'list_invoices',
    description: 'List all invoices with their status, amounts, and due dates.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        status: {
          type: 'string',
          enum: ['all', 'draft', 'sent', 'viewed', 'overdue', 'paid'],
          default: 'all',
          description: 'Filter by invoice status',
        },
      },
    },
  },
  {
    name: 'get_invoice',
    description:
      'Get detailed information about a specific invoice including line items, reminders, and payment status.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        invoice_id: {
          type: 'string',
          description: 'The invoice ID',
        },
      },
      required: ['invoice_id'],
    },
  },
  {
    name: 'mark_invoice_paid',
    description:
      'Mark an invoice as paid and cancel all pending reminder emails.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        invoice_id: {
          type: 'string',
          description: 'The invoice ID to mark as paid',
        },
      },
      required: ['invoice_id'],
    },
  },
  {
    name: 'add_reminder',
    description: "Add a new reminder to an existing invoice's chase sequence.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        invoice_id: {
          type: 'string',
          description: 'The invoice ID',
        },
        subject: { type: 'string' },
        body: { type: 'string' },
        scheduled_date: {
          type: 'string',
          description: 'When to send (ISO date)',
        },
        tone: {
          type: 'string',
          enum: ['friendly', 'firm', 'final'],
        },
      },
      required: ['invoice_id', 'subject', 'body', 'scheduled_date', 'tone'],
    },
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbols[currency] ?? currency;
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function fmtDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function textResponse(text: string) {
  return { content: [{ type: 'text' as const, text }] };
}

function errorResponse(message: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

async function createInvoice(args: Record<string, unknown>) {
  const clientName = args.client_name as string;
  const clientEmail = (args.client_email as string) ?? null;
  const title = args.title as string;
  const currency = (args.currency as string) ?? 'INR';
  const dueDateStr = args.due_date as string;
  const notes = (args.notes as string) ?? null;
  const lineItemsInput = args.line_items as Array<{
    description: string;
    quantity?: number;
    unit_price: number;
  }>;
  const remindersInput = args.reminders as Array<{
    subject: string;
    body: string;
    days_offset: number;
    tone: string;
  }>;

  const dueDate = new Date(dueDateStr);
  if (isNaN(dueDate.getTime())) {
    return errorResponse(`Invalid due date: ${dueDateStr}`);
  }

  const publicSlug = nanoid(10);

  // Build line-item data
  const lineItemsData = lineItemsInput.map((item) => {
    const qty = item.quantity ?? 1;
    return {
      description: item.description,
      quantity: qty,
      unitPrice: item.unit_price,
      amount: qty * item.unit_price,
    };
  });

  // Build reminder data
  const remindersData = remindersInput.map((r, idx) => ({
    subject: r.subject,
    body: r.body,
    scheduledDate: addDays(dueDate, r.days_offset),
    status: 'pending',
    tone: r.tone,
    sendOrder: idx + 1,
  }));

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        clientName,
        clientEmail,
        title,
        currency,
        dueDate,
        publicSlug,
        notes,
        lineItems: { create: lineItemsData },
        reminders: { create: remindersData },
      },
      include: { lineItems: true, reminders: true },
    });
    return inv;
  });

  const total = invoice.lineItems.reduce((sum, li) => sum + li.amount, 0);

  // Build reminder table
  const sortedReminders = [...invoice.reminders].sort(
    (a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()
  );
  const reminderRows = sortedReminders
    .map(
      (r) =>
        `  ${fmtDate(r.scheduledDate)}  │  ${r.tone.padEnd(8)}  │  ${r.subject}`
    )
    .join('\n');

  const text = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Invoice Created Successfully
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Title:       ${invoice.title}
🆔 Invoice ID:  ${invoice.id}
👤 Client:      ${invoice.clientName}${invoice.clientEmail ? `  (${invoice.clientEmail})` : ''}
💰 Total:       ${formatCurrency(total, currency)}
📅 Due Date:    ${fmtDate(dueDate)}
📊 Status:      ${invoice.status}

🔗 Public Link (share with client):
   http://localhost:3000/invoice/${invoice.publicSlug}

📊 Dashboard Link:
   http://localhost:3000/dashboard/invoice/${invoice.id}

   (Update the base URL for production deployments)

📬 ${sortedReminders.length} Reminder(s) Scheduled:
  ──────────────────────────────────────────────
  Date        │  Tone      │  Subject
  ──────────────────────────────────────────────
${reminderRows}
  ──────────────────────────────────────────────
`.trim();

  return textResponse(text);
}

async function listInvoices(args: Record<string, unknown>) {
  const statusFilter = (args.status as string) ?? 'all';

  const where =
    statusFilter === 'all' ? {} : { status: statusFilter };

  const invoices = await prisma.invoice.findMany({
    where,
    include: { lineItems: true },
    orderBy: { createdAt: 'desc' },
  });

  if (invoices.length === 0) {
    return textResponse(
      statusFilter === 'all'
        ? 'No invoices found. Create one with the create_invoice tool!'
        : `No invoices found with status "${statusFilter}".`
    );
  }

  const rows = invoices.map((inv) => {
    const total = inv.lineItems.reduce((sum, li) => sum + li.amount, 0);
    const statusEmoji: Record<string, string> = {
      draft: '⚪',
      sent: '🔵',
      viewed: '🟣',
      overdue: '🔴',
      paid: '🟢',
    };
    const emoji = statusEmoji[inv.status] ?? '⚪';
    return `  ${emoji} ${inv.status.toUpperCase().padEnd(7)}  │  ${formatCurrency(total, inv.currency).padStart(14)}  │  ${fmtDate(inv.dueDate)}  │  ${inv.clientName}  │  ${inv.title}  │  ${inv.id}`;
  });

  const text = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Invoices${statusFilter !== 'all' ? ` (${statusFilter})` : ''} — ${invoices.length} total
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Status   │  Amount          │  Due Date    │  Client        │  Title         │  ID
  ──────────────────────────────────────────────────────────────────────────────────────
${rows.join('\n')}
  ──────────────────────────────────────────────────────────────────────────────────────
`.trim();

  return textResponse(text);
}

async function getInvoice(args: Record<string, unknown>) {
  const invoiceId = args.invoice_id as string;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      lineItems: true,
      reminders: { orderBy: { sendOrder: 'asc' } },
    },
  });

  if (!invoice) {
    return errorResponse(`Invoice not found: ${invoiceId}`);
  }

  const total = invoice.lineItems.reduce((sum, li) => sum + li.amount, 0);

  // Line items table
  const itemRows = invoice.lineItems
    .map(
      (li) =>
        `  ${li.description.padEnd(30)}  │  ${li.quantity.toString().padStart(5)}  │  ${formatCurrency(li.unitPrice, invoice.currency).padStart(12)}  │  ${formatCurrency(li.amount, invoice.currency).padStart(12)}`
    )
    .join('\n');

  // Reminders table
  const reminderRows = invoice.reminders
    .map((r) => {
      const statusEmoji: Record<string, string> = {
        pending: '⏳',
        sent: '✅',
        skipped: '⏭️',
        cancelled: '❌',
      };
      const emoji = statusEmoji[r.status] ?? '⏳';
      return `  ${emoji} ${r.status.padEnd(10)}  │  ${fmtDate(r.scheduledDate)}  │  ${r.tone.padEnd(8)}  │  ${r.subject}`;
    })
    .join('\n');

  const statusEmoji: Record<string, string> = {
    draft: '⚪',
    sent: '🔵',
    viewed: '🟣',
    overdue: '🔴',
    paid: '🟢',
  };
  const emoji = statusEmoji[invoice.status] ?? '⚪';

  const text = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Invoice Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 ID:          ${invoice.id}
📄 Title:       ${invoice.title}
👤 Client:      ${invoice.clientName}${invoice.clientEmail ? `  (${invoice.clientEmail})` : ''}
${emoji} Status:      ${invoice.status.toUpperCase()}
💰 Total:       ${formatCurrency(total, invoice.currency)}
💱 Currency:    ${invoice.currency}
📅 Due Date:    ${fmtDate(invoice.dueDate)}
📝 Notes:       ${invoice.notes ?? '—'}
🕐 Created:     ${invoice.createdAt.toISOString()}

🔗 Public Link: http://localhost:3000/invoice/${invoice.publicSlug}
📊 Dashboard:   http://localhost:3000/dashboard/invoice/${invoice.id}

📦 Line Items (${invoice.lineItems.length}):
  ──────────────────────────────────────────────────────────────────────────
  Description                     │  Qty    │  Unit Price   │  Amount
  ──────────────────────────────────────────────────────────────────────────
${itemRows}
  ──────────────────────────────────────────────────────────────────────────
  ${'TOTAL'.padEnd(30)}  │         │               │  ${formatCurrency(total, invoice.currency).padStart(12)}

📬 Reminders (${invoice.reminders.length}):
  ──────────────────────────────────────────────────────────────────────────
  Status       │  Scheduled    │  Tone      │  Subject
  ──────────────────────────────────────────────────────────────────────────
${reminderRows || '  (no reminders)'}
  ──────────────────────────────────────────────────────────────────────────
`.trim();

  return textResponse(text);
}

async function markInvoicePaid(args: Record<string, unknown>) {
  const invoiceId = args.invoice_id as string;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lineItems: true, reminders: true },
  });

  if (!invoice) {
    return errorResponse(`Invoice not found: ${invoiceId}`);
  }

  if (invoice.status === 'paid') {
    return textResponse(`Invoice "${invoice.title}" is already marked as paid.`);
  }

  const pendingCount = invoice.reminders.filter(
    (r) => r.status === 'pending'
  ).length;

  await prisma.$transaction([
    prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'paid' },
    }),
    prisma.reminder.updateMany({
      where: { invoiceId, status: 'pending' },
      data: { status: 'cancelled' },
    }),
  ]);

  const total = invoice.lineItems.reduce((sum, li) => sum + li.amount, 0);

  const text = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 Invoice Marked as Paid
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Title:       ${invoice.title}
🆔 Invoice ID:  ${invoice.id}
👤 Client:      ${invoice.clientName}
💰 Amount:      ${formatCurrency(total, invoice.currency)}
📅 Due Date:    ${fmtDate(invoice.dueDate)}

❌ ${pendingCount} pending reminder(s) cancelled.

No further chase emails will be sent for this invoice.
`.trim();

  return textResponse(text);
}

async function addReminder(args: Record<string, unknown>) {
  const invoiceId = args.invoice_id as string;
  const subject = args.subject as string;
  const body = args.body as string;
  const scheduledDateStr = args.scheduled_date as string;
  const tone = args.tone as string;

  const scheduledDate = new Date(scheduledDateStr);
  if (isNaN(scheduledDate.getTime())) {
    return errorResponse(`Invalid scheduled date: ${scheduledDateStr}`);
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { reminders: true },
  });

  if (!invoice) {
    return errorResponse(`Invoice not found: ${invoiceId}`);
  }

  if (invoice.status === 'paid') {
    return errorResponse(
      `Cannot add reminders to a paid invoice. Invoice "${invoice.title}" is already marked as paid.`
    );
  }

  const maxOrder = invoice.reminders.reduce(
    (max, r) => Math.max(max, r.sendOrder),
    0
  );

  const reminder = await prisma.reminder.create({
    data: {
      invoiceId,
      subject,
      body,
      scheduledDate,
      status: 'pending',
      tone,
      sendOrder: maxOrder + 1,
    },
  });

  const text = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📬 Reminder Added
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Invoice:     ${invoice.title} (${invoice.id})
👤 Client:      ${invoice.clientName}
🆔 Reminder ID: ${reminder.id}
📧 Subject:     ${subject}
🎯 Tone:        ${tone}
📅 Scheduled:   ${fmtDate(scheduledDate)}
📊 Send Order:  #${reminder.sendOrder}

This reminder has been added to the chase sequence.
`.trim();

  return textResponse(text);
}

// ---------------------------------------------------------------------------
// Request handlers
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_invoice':
        return await createInvoice(args ?? {});
      case 'list_invoices':
        return await listInvoices(args ?? {});
      case 'get_invoice':
        return await getInvoice(args ?? {});
      case 'mark_invoice_paid':
        return await markInvoicePaid(args ?? {});
      case 'add_reminder':
        return await addReminder(args ?? {});
      default:
        return errorResponse(`Unknown tool: ${name}`);
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred';
    console.error(`[chaseflow-mcp] Error in tool "${name}":`, err);
    return errorResponse(message);
  }
});

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ChaseFlow MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal error starting ChaseFlow MCP server:', err);
  process.exit(1);
});
