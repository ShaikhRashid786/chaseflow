# ChaseFlow ⚡
> **Automated B2B Invoice Chasing & Accounts Receivable platform that runs on Claude — with ZERO AI inside.**


---

## 🎯 The Core Philosophy: Zero AI Overhead

Most AI products are margin traps: every time a customer generates an invoice or sends an email, the app pays OpenAI or Anthropic API fees ($0.03–$0.15 per call).

**ChaseFlow flips this dynamic entirely:**
- **Your customer already pays for Claude Pro/Team.**
- When they type a natural-language request into Claude, Claude executes the hard cognitive work (drafting professional invoice line items and writing a 3-stage diplomatic, escalating reminder sequence).
- Claude calls ChaseFlow via **MCP (Model Context Protocol)**.
- **ChaseFlow has zero AI keys, pays $0 for AI inference, and runs on pure deterministic code.**
- ChaseFlow does what Claude **cannot** do:
  1. It stays live on the web permanently.
  2. It hosts a public, branded invoice link for the client to review and settle.
  3. It remembers to send reminder 2 in 7 days and reminder 3 in 14 days when the user is asleep and the chat is closed.
  4. It auto-cancels reminders the second the invoice is marked paid.

---

## 🏗️ Architecture

```
┌─────────────────────────────────┐
│     Customer's Claude Chat      │  <-- Customer pays for Claude Plan
│  "Invoice Acme for ₹85,000      │
│   and chase them politely"      │
└───────────────┬─────────────────┘
                │ Model Context Protocol (MCP)
                ▼
┌─────────────────────────────────┐
│     ChaseFlow MCP Server        │  <-- Tools: create_invoice, list_invoices,
│     (mcp-server/index.ts)       │            mark_invoice_paid, add_reminder
└───────────────┬─────────────────┘
                │ Direct Database Write
                ▼
┌─────────────────────────────────┐
│     ChaseFlow Core Engine       │  <-- ZERO AI Keys. $0 AI Cost.
│     (Next.js 14 + Prisma + DB)  │
├─────────────────────────────────┤
│ • Human-in-the-loop Dashboard   │  <-- Edit line items, tone, reminder dates
│ • Public Live Invoice View      │  <-- /invoice/[slug] (Clean client page)
│ • Automated Chase Schedule      │  <-- Executes follow-ups on calendar queue
│ • Instant "Mark Paid" & Cancel  │  <-- Halts pending reminders automatically
└─────────────────────────────────┘
```

---

## 🚀 Quick Start (Local Development)

### 1. Install & Database Setup
```bash
# Clone or navigate to the directory
cd chaseflow

# Install dependencies
npm install

# Push database schema & seed initial sample invoices
npx prisma db push
npx tsx prisma/seed.ts
```

### 2. Start the Web App
```bash
npm run dev
```
Open **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)** in your browser.

---

## 🔌 Connecting to Claude Desktop (MCP)

To connect Claude Desktop to ChaseFlow:

1. Open your Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Add `chaseflow` to the `mcpServers` object:

```json
{
  "mcpServers": {
    "chaseflow": {
      "command": "npx",
      "args": ["tsx", "mcp-server/index.ts"],
      "cwd": "C:/Users/LENOVO/.gemini/antigravity/scratch/chaseflow"
    }
  }
}
```
*(Make sure `cwd` points to your absolute `chaseflow` folder path using forward slashes).*

3. Restart Claude Desktop. You will see the hammer/tools icon indicating 5 ChaseFlow tools are connected:
   - `create_invoice`: Create invoice with line items & reminder sequence
   - `list_invoices`: List all invoices with status and totals
   - `get_invoice`: Inspect details, items, and scheduled chasers
   - `mark_invoice_paid`: Mark settled and cancel pending reminders
   - `add_reminder`: Add a custom follow-up reminder

### Test Prompt in Claude:
> *"Create an invoice for Acme Corp, ₹85,000 for Q3 Growth Marketing Sprint, due in 7 days, and chase them politely."*

Claude will automatically craft:
- The structured line items.
- A 3-step reminder sequence:
  - **T-2 days**: Gentle reminder (friendly).
  - **Due date**: Due today notice (firm).
  - **T+5 days overdue**: Escalation (final).
- Invoke `create_invoice` via MCP.
- Return the live public invoice URL and dashboard management link!

---

## 🌐 Deploying Live to the Internet

You can deploy ChaseFlow to **Vercel** or **Render** in 2 minutes:

### Option A: Vercel (Recommended)
1. Push this directory to a GitHub repository.
2. Import the repository in [Vercel](https://vercel.com).
3. Set Environment Variable:
   - `NEXT_PUBLIC_APP_URL` = `https://your-app-name.vercel.app`
   - `DATABASE_URL` = `file:./dev.db` (or link to a serverless Turso/Supabase Postgres DB).
4. Click **Deploy**.




