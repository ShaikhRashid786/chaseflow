# ChaseFlow ⚡
> **Automated B2B Invoice Chasing & Accounts Receivable platform that runs on Claude — with ZERO AI inside.**

Built for the **Volopay Product & Tech Assignment**.

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

---

## 📹 5-Minute Pitch Video Script (Rubric-Matched)

Use this exact timing and script breakdown for your 5-minute founder pitch video:

### 1. Who You Are (0:00 - 0:45)
> *"Hi Sandeep and Rosh. I'm [Your Name], founder of ChaseFlow. I'm a full-stack product engineer passionate about B2B financial workflows and cash flow automation. I love building high-leverage products that eliminate operational friction for businesses."*

### 2. Your Best Work (0:45 - 1:15)
> *"In my recent work, I built [Mention a standout project / scalable web app / high-volume system]. For example, I shipped [Project Name], handling [X metric / users / transactions] with zero downtime. I focus on high-velocity execution, clean architecture, and products that deliver immediate ROI."*

### 3. Why This Business Will Win (1:15 - 2:15)
> *"Unpaid invoices are the number one cash-flow killer for SMBs, consultants, and agencies. In the UK alone, late payments cause 50,000 small businesses to fail every year.*
> 
> *Traditional accounting software like QuickBooks or FreshBooks has automated reminders, but they are rigid, robotic templates that sound like a collection agency. Writing bespoke, diplomatic emails manually takes hours of mental overhead.*
> 
> *Claude is the greatest copywriter in the world. It can write the perfect diplomatic nudge tailored to any client relationship. But Claude has three fatal flaws: it can't remember to follow up in 14 days, it can't host a live payment link, and it has no persistent state.*
> 
> *ChaseFlow bridges this gap with zero AI inside our backend. The customer pays Claude. Claude writes the sequence. ChaseFlow hosts the invoice, lets the human review the wording, and guarantees the reminders go out on schedule until paid."*

### 4. The Live Demo (2:15 - 4:15)
1. **Show Claude Desktop**: Type:
   > *"Create an invoice for Acme Corp, ₹85,000 for Q3 Growth Marketing Sprint, due in 7 days, and chase them politely."*
2. **Watch Claude invoke MCP**: Show Claude calling `create_invoice` with line items and 3 escalating reminders.
3. **Switch to ChaseFlow Dashboard**: Open `http://localhost:3000/dashboard`.
   - Show the invoice instantly appearing under "Sent".
   - Click into the invoice.
   - **Show the Human-in-the-Loop requirement**: Edit one line item amount, edit the tone of Reminder #2, and change the scheduled follow-up date.
   - Click "Save Changes".
4. **Open Public Invoice Link**: Show `/invoice/[slug]` — clean, distraction-free view with breakdown and "Mark as Paid".
5. **Mark Paid**: Click "Mark Paid" in the app $\rightarrow$ show pending reminders instantly transitioning to "Cancelled".

### 5. The Money & Unit Economics (4:15 - 5:00)
> *"**Unit Economics**: Our COGS per customer is practically zero. Because Claude provides the intelligence on the customer's dime, we pay $0 in LLM API bills. Our server and database costs on Vercel/Fly are under $0.03 per customer per month. We run at 99%+ gross margins.*
>
> ***Pricing**: We charge a flat $29/month for freelancers and $79/month for agencies with team accounts. One recovered ₹85,000 invoice pays for 2 years of the subscription.*
> 
> ***First 100 Customers**: We will acquire our first 100 customers by launching directly into Claude and Cursor community directories, Indie Hackers, and B2B agency Slack communities with a 14-day free trial.*
> 
> ***Year 1 & Year 3 Vision**:*
> - *Year 1: 500 paying agencies = $174,000 ARR.*
> - *Year 3: $1.8M ARR by adding embedded payment links (Stripe/UPI) and taking a 0.5% convenience fee on accelerated settlements."*

---

## 📦 What to Send to Volopay
1. **Your 5-minute video link** (Loom, YouTube Unlisted, or Drive).
2. **Your live app link** (Vercel URL, e.g. `https://chaseflow.vercel.app/dashboard`).
3. **Your MCP link & setup steps** (Point to this repository's `mcp-server/index.ts` and `claude_desktop_config.example.json`).
