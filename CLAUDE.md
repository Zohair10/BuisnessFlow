# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run db:generate  # Generate Prisma client from schema
npm run db:push      # Push schema changes to database (no migrations)
npm run db:studio    # Open Prisma Studio GUI
```

There is no test runner configured. No test files exist in the codebase yet.

## Quick Setup

1. Copy `.env.example` to `.env` and fill in values. Minimum required for dev: `DATABASE_URL`, `AUTH_SECRET`, `ANTHROPIC_API_KEY`, `ENCRYPTION_KEY`.
2. `npm run db:push` to sync the Prisma schema to your database.
3. `npm run dev` to start.
4. Generate secrets: `bash scripts/generate-secrets.sh`.

## Architecture

### Core Query Pipeline (`app/api/query/route.ts`)

This is the heart of the app. A user question flows through:

1. **Auth + workspace check** — middleware + route-level validation
2. **Schema retrieval** (`lib/db/schema-retrieval.ts`) — selects relevant schema chunks, never the full schema
3. **Claude call #1** (`lib/ai/build-query-plan.ts`) — natural language → `QueryPlan` (the canonical IR)
4. **Compile** (`lib/ai/compile-query-plan.ts`) — `QueryPlan` → SQL (Postgres/MySQL) or MongoDB pipeline
5. **Sanitize** (`lib/db/sanitize-sql.ts` or `sanitize-pipeline.ts`) — SELECT-only AST enforcement for SQL, stage allowlist for Mongo
6. **Execute** — routed via `lib/db/router.ts` to the correct connector
7. **Privacy filter** (`lib/security/redact.ts`) — mask sensitive columns
8. **Format decision** (`lib/ai/decide-format.ts`) — heuristic-first, then optional Claude call
9. **Summarize** (`lib/ai/summarize-result.ts`) — Claude call #2 with safe payload only
10. **Cache** (`lib/cache/query-cache.ts`) — Redis-backed, 1-hour TTL

### Key Patterns

- **Path alias**: `@/*` maps to the project root. Import as `@/lib/...`, `@/components/...`, `@/types/...`.
- **Auth**: NextAuth v5 with JWT sessions. Three providers: Credentials, Google, GitHub. Config in `lib/auth.ts`. Middleware in `middleware.ts` protects `/(dashboard)` and `/api/*` routes (excludes `/api/auth` and `/api/auth/register`).
- **Connectors**: Each DB connector (`lib/db/connectors/*.ts`) exports `testConnection`, `getSchema`, and `executeQuery`. New connectors follow this interface.
- **QueryPlan**: The canonical intermediate representation (defined in `types/query.ts`). Never bypass it — all connectors compile from QueryPlan, not from raw SQL.
- **State management**: Zustand store at `lib/store/chat-store.ts` manages all chat UI state (sessions, messages, active connection, loading).
- **Credentials encryption**: DB connection credentials are encrypted at rest with AES-256-GCM (`lib/security/encrypt.ts`).
- **Dark theme only**: The app is dark-mode only. CSS variables in `app/globals.css` define the dark palette. No light mode variables exist.
- **File uploads**: CSV/Excel stored in S3/R2, materialized into DuckDB at query time (`lib/files/materialize-duckdb.ts`). Not in-memory.
- **Next.js config**: DuckDB is an external on the server bundle. `fs`, `path`, `crypto` are excluded from the client bundle. Server action body limit is 50MB for file uploads.

### Data Model

Single Prisma schema (`prisma/schema.prisma`) with PostgreSQL provider. Nine models, nine enums. Uses `db push` (no migration files). Key relationships:

- `Workspace` → `WorkspaceMember` → `User` (RBAC: OWNER/ADMIN/MEMBER)
- `Workspace` → `DataConnection` (credentials encrypted in `credentials` JSON field)
- `QuerySession` → `QueryMessage` (chat history)
- `QueryRun` (execution record, links to session + connection + workspace)

### Frontend Structure

- `app/(auth)/` — login/signup pages with centered layout
- `app/(dashboard)/` — main app shell with `SidebarNav`. Pages: chat, connections, history, settings
- `components/chat/` — `ChatInterface` is the main orchestrator. `ResponseRenderer` delegates to `ChartRenderer` (Recharts), `TableRenderer`, or `InsightCard` based on response kind.
- `components/ui/` — shadcn/ui primitives (Radix-based). Use these for all new UI components.

---

## Product Reference (PRD)

> Source PRD: `querymind_saas_prd.html`
> Positioning reference: Business Pulse (`businesspulse.ai`)

---

## 1) Product Direction

Buisness Flow is a multi-tenant conversational analytics SaaS for non-technical users to ask data questions in plain English and receive answers as text, tables, or charts.

### Product principles
- Natural-language analytics for non-technical teams
- One active data source per chat session in v1
- Strong workspace isolation and RBAC
- Read-only querying only
- Transparent answers with SQL / query preview
- Exportable outputs (CSV / PNG / copyable insight cards)
- Privacy-first design with controllable LLM data exposure
- Semantic understanding through schema retrieval plus business glossary / KPI definitions

### Reference alignment with Business Pulse
The live reference product emphasizes:
- chat-based analytics,
- charts / summaries / exports,
- trainable AI via company-specific KPIs and internal terms,
- RBAC and activity logging,
- one active data source at a time,
- a semantic layer / data dictionary for accurate answers,
- and strong privacy language around keeping data under customer control.

Buisness Flow should follow the same operating model for v1, while remaining simpler in implementation.

---

## 2) Final Answers to the Open Product Questions

### 2.1 Is MongoDB in v1?
**Decision:** MongoDB is **not GA in v1**. It is a **beta / feature-flagged connector** targeted for v1.1 unless there is a paying design partner that explicitly needs it.

**Why:**
- The PRD includes MongoDB, but the original architecture is SQL-centric and depends on SELECT-only sanitization.
- MongoDB adds major complexity in query generation, schema inference, safety, and result consistency.
- Industry-standard v1 focus is to maximize answer quality on a narrow, high-confidence scope.

**GA v1 connectors:**
- PostgreSQL
- MySQL
- CSV upload
- Excel upload

**Beta connector:**
- MongoDB

**Important:** Even though MongoDB is beta, the architecture must be prepared for it from day one.

### 2.2 What is the canonical intermediate representation?
**Decision:** The canonical IR is a **generic `QueryPlan`**, not raw SQL.

`QueryPlan` is then compiled per connector:
- PostgreSQL / MySQL / CSV / Excel-backed tabular engine -> SQL
- MongoDB -> Mongo aggregation pipeline

This avoids locking the architecture into SQL-only assumptions.

#### QueryPlan shape
```ts
interface QueryPlan {
  sourceType: 'postgres' | 'mysql' | 'csv' | 'excel' | 'mongodb'
  intent: 'aggregate' | 'filter' | 'group' | 'timeseries' | 'ranking' | 'detail'
  entities: string[]
  fields: Array<{
    field: string
    agg?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct_count'
    alias?: string
  }>
  filters: Array<{
    field: string
    op: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'between' | 'contains'
    value: unknown
  }>
  groupBy?: string[]
  orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>
  limit?: number
  timeGrain?: 'day' | 'week' | 'month' | 'quarter' | 'year'
}
```

### 2.3 What exactly is a session?
**Decision:** Sessions, messages, and query runs are separate entities.

#### Definitions
- **QuerySession**: a conversation container tied to one workspace and one active connection at a time.
- **QueryMessage**: an individual user or assistant message in that session.
- **QueryRun**: one execution attempt for a user question, including generated query, result metadata, timing, and errors.

This separation is required for:
- threaded chat history,
- retries and reruns,
- observability,
- and future features like feedback and sharing.

### 2.4 What is the true v1 scope for data sources?
**Decision:**

#### Day-one GA
- PostgreSQL
- MySQL
- CSV
- Excel

#### Post-GA / beta
- MongoDB

#### Explicitly out of scope for v1
- Snowflake / BigQuery / Redshift native connectors
- SQL Server
- Google Sheets live sync
- cross-connection joins
- writeback / reverse ETL

### 2.5 How will CSV/Excel persistence work on serverless?
**Decision:** Uploaded files are persisted as **workspace-scoped reusable data connections**.

#### Storage model
- Raw file stored in **S3 or Cloudflare R2**
- Metadata stored in platform DB
- Schema inferred at upload time and cached
- On query, the file is materialized into an **ephemeral query engine** (DuckDB preferred; SQLite acceptable fallback)
- No assumption of process-local in-memory persistence across requests

#### Why
“In-memory SQLite per session” is fragile on serverless runtimes because instances are ephemeral and not sticky.

#### v1 file rules
- Default max file size: 25 MB Free, 100 MB Pro, custom for Enterprise
- Retention: persistent until deleted by the user, not temporary session-only
- Uploaded files appear in Connections like any other source
- Each uploaded file can be renamed, re-used, refreshed, and deleted

### 2.6 What is the privacy boundary for Claude call #2?
**Decision:** Raw rows should **not** be sent blindly to the LLM by default.

#### v1 privacy model
Two modes:

1. **Standard mode**
   - Send only the minimum shaped data needed for formatting and summary
   - Cap rows aggressively
   - Mask columns flagged sensitive
   - Prefer aggregates over full records

2. **Strict privacy mode**
   - No raw-row LLM egress after execution
   - Formatting decided locally using deterministic heuristics
   - Summary generated from safe metadata / aggregates only

#### Sensitive column policy
Columns matching configurable patterns are masked or excluded before model calls:
- email
- phone
- address
- ssn / national id
- token
- secret
- api_key
- password

### 2.7 How do we handle large schemas?
**Decision:** Never inject the full schema into every prompt.

#### Strategy
Use **schema retrieval**, not blanket injection:
- maintain a schema index
- store table / column names, types, relationships, descriptions, examples, and usage stats
- rank relevant tables based on question intent
- inject only the top relevant schema chunks
- supplement with business glossary / KPI definitions

#### Semantic layer approach
Introduce a lightweight semantic layer:
- business-friendly metric names
- canonical definitions for KPIs
- synonyms for internal terms
- curated table descriptions

This follows the Business Pulse reference direction and is the industry-standard fix for poor NL-to-query accuracy on real customer schemas.

### 2.8 What counts toward billing and limits?
**Decision:** Billing should be based on **successful uncached query runs**.

#### Counts toward monthly usage
- successful execution that reaches the database or file engine and returns a valid result payload
- zero-row results still count if the query executed successfully

#### Does not count
- platform-side failures before execution
- LLM timeout before query generation completes
- connection errors on our side
- sanitizer rejection caused by system bug
- cached response served without re-execution

#### Retry policy
- identical retry within 60 seconds after a platform-side error: does **not** count
- manual rerun that triggers a fresh execution after success: **counts**
- edited question: **counts**

#### Rate limit
- 10 requests/minute/workspace baseline
- burst-controlled via Redis
- higher tiers configurable per plan

### 2.9 What are the actual workspace roles and permissions?
**Decision:** Use 3 roles in v1.

#### Roles
1. **Owner**
   - full workspace control
   - billing
   - invite/remove users
   - change roles
   - manage all connections
   - delete workspace

2. **Admin**
   - manage connections
   - manage sessions/history
   - invite members
   - view workspace analytics
   - cannot delete workspace or manage billing

3. **Member**
   - run queries
   - create sessions
   - export results
   - view allowed connection history
   - cannot manage billing or roles

#### Future role
- **Viewer** for read-only consumer seats

### 2.10 Do we support cross-connection analysis?
**Decision:** **No**. Explicitly out of scope for v1.

Only one connection is active per session, mirroring the reference product’s model.

#### Future direction
Cross-source analysis can be added later via:
- semantic layer unification,
- warehouse-first modeling,
- or federated query execution.

But v1 must not promise it.

### 2.11 What is the canonical response contract?
**Decision:** The canonical response kind is:
- `text`
- `table`
- `chart`

Chart subtype is separate:
- `bar`
- `line`
- `pie`

This is cleaner than mixing response type and chart subtype in one enum.

### 2.12 How will MongoDB schema introspection work?
**Decision:** For MongoDB beta, introspection is based on:
- sampled documents,
- inferred field paths,
- type frequency,
- nullability estimate,
- nested path flattening,
- and optional manual schema hints.

#### Rules
- sample recent documents per collection
- cap sample size
- infer field paths like `customer.name`, `items[].sku`
- store confidence per field
- allow admin to mark fields as hidden / safe / preferred

Mongo must never rely on “all documents share identical structure.”

### 2.13 What is the evaluation harness?
**Decision:** Use a 4-layer harness.

1. **Safety tests**
   - non-read queries blocked
   - cross-workspace access blocked
   - injection attempts blocked

2. **Execution tests**
   - generated query compiles
   - query executes
   - latency within target

3. **Answer correctness tests**
   - compare returned answer set or normalized aggregates to gold outputs
   - use gold SQL only as a secondary metric

4. **Presentation tests**
   - correct response kind chosen
   - chart subtype appropriate
   - summary faithful to result set

#### Primary success metrics
- execution success rate
- answer correctness rate
- hallucinated-field rate
- format selection accuracy
- P95 latency
- unsafe-query rejection rate

---

## 3) Product Scope

### v1 Goals
- conversational analytics for one active data connection at a time
- schema-aware query generation
- text / table / chart answers
- query history and reruns
- CSV / Excel upload as reusable connections
- multi-tenant workspaces with RBAC
- billing and rate limits

### v1 Non-goals
- cross-connection joins
- on-prem deployment
- write operations
- real-time streaming analytics
- full dashboard builder
- alerting engine
- warehouse-native semantic modeling UI

---

## 4) Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Auth | NextAuth.js v5 |
| ORM | Prisma (platform DB only) |
| AI | Anthropic Claude API |
| DB Drivers | pg, mysql2, mongoose |
| File Query Engine | DuckDB preferred, SQLite fallback |
| Platform DB | PostgreSQL (Neon / Supabase) |
| Cache / Rate Limiting | Redis (Upstash) |
| Billing | Stripe |
| Object Storage | S3 / Cloudflare R2 |
| Monitoring | Sentry + PostHog |

---

## 5) Frontend Implementation Directive

The frontend must be designed and built using the installed **UI/UX Pro Max skill** as the required design standard.

### Frontend quality bar
- polished SaaS visuals comparable to modern analytics products
- chart-first answer presentation
- premium empty, loading, and error states
- strong visual hierarchy
- clean onboarding for first-time users
- mobile-responsive but desktop-first for analytics workflows
- accessible components using shadcn/ui primitives
- delightful transitions, but never at the cost of clarity

### UX principles
- one obvious primary action per screen
- active connection always visible in chat header
- SQL / query preview is transparent but collapsible
- response type switching must feel instant
- chart/table/text should render inside one unified response shell
- export actions should be close to the answer, not buried
- query history should be searchable and rerunnable
- onboarding should include a sample dataset workspace

### Visual reference direction
Take inspiration from Business Pulse in these areas:
- conversational analytics positioning
- visual summaries and chart-first communication
- team-oriented analytics UX
- export-friendly reports

Do **not** copy branding or layout directly. Use the reference only as product-direction guidance.

---

## 6) Memory and Token Management Directive

The implementation workflow must use the installed **claude-mem skill** for efficient memory handling, context continuity, and token discipline during development and iterative feature work.

### Required usage principles
- use claude-mem to retain durable project decisions, architecture choices, and naming conventions
- avoid repeating large unchanged context blocks across iterations
- prefer compact structured memory over verbose prompt restatement
- store stable product rules, connector constraints, response contracts, and RBAC decisions as reusable memory artifacts
- keep active working context focused on the current feature or bugfix only
- summarize prior implementation state before large follow-up tasks instead of replaying full history
- use memory to reduce token waste in long-running product conversations and implementation sessions

### What should be remembered
- canonical `QueryPlan` architecture
- v1 connector scope and MongoDB beta status
- one-active-connection-per-session rule
- privacy mode rules and sensitive-column masking policy
- canonical response contract
- workspace roles and permissions
- frontend quality bar and UI/UX Pro Max requirement

### What should not be kept in active context
- large repeated schema dumps unless currently needed
- entire previous chats copied verbatim
- duplicate copies of unchanged file structures or API contracts
- raw query result payloads beyond the current debugging or rendering need


## 7) Directory Structure

```txt
app/
  (auth)/login/page.tsx
  (auth)/signup/page.tsx
  (dashboard)/
    layout.tsx
    chat/page.tsx
    connections/page.tsx
    history/page.tsx
    settings/page.tsx
  api/
    auth/[...nextauth]/route.ts
    query/route.ts
    connections/route.ts
    connections/[id]/route.ts
    connections/[id]/test/route.ts
    upload/route.ts
    history/route.ts
    sessions/route.ts
    sessions/[id]/route.ts
components/
  chat/
    ChatInterface.tsx
    MessageBubble.tsx
    ResponseRenderer.tsx
    ChartRenderer.tsx
    TableRenderer.tsx
    InsightCard.tsx
    SQLPreview.tsx
    SessionSidebar.tsx
  connections/
    ConnectionForm.tsx
    ConnectionCard.tsx
  layout/
    WorkspaceSwitcher.tsx
    SidebarNav.tsx
  ui/
lib/
  ai/
    build-query-plan.ts
    compile-query-plan.ts
    decide-format.ts
    summarize-result.ts
    prompts.ts
  db/
    connectors/
      postgres.ts
      mysql.ts
      mongodb.ts
      file-tabular.ts
    router.ts
    sanitize-sql.ts
    sanitize-pipeline.ts
    schema-retrieval.ts
  files/
    upload.ts
    materialize-duckdb.ts
  security/
    encrypt.ts
    redact.ts
    rate-limit.ts
  prisma.ts
  auth.ts
prisma/
  schema.prisma
types/
  query.ts
  connection.ts
  session.ts
middleware.ts
```

---

## 8) Core Query Pipeline

### `/api/query` request
```json
{
  "workspaceId": "ws_123",
  "connectionId": "conn_123",
  "sessionId": "sess_123",
  "question": "Show me top 10 customers by revenue this month"
}
```

### Pipeline
1. Validate auth and workspace membership
2. Validate connection belongs to workspace
3. Load active connection + retrieved schema chunks + business glossary
4. Claude call #1 -> build `QueryPlan`
5. Compile `QueryPlan` into connector-specific executable query
6. Safety enforcement
   - SQL AST allowlist for relational connectors
   - pipeline stage allowlist for MongoDB
7. Execute query against active connection
8. Normalize result into tabular response shape
9. Local privacy filter / masking
10. Format decision
    - heuristic first
    - optional Claude call #2 with safe shaped payload
11. Store `QueryRun`
12. Return response

### Why this architecture
- separates reasoning from execution
- supports multiple connector types
- reduces SQL-centric lock-in
- improves safety and debuggability

---

## 9) Query Safety

### Relational connectors
- AST-based SELECT-only enforcement
- forbid multiple statements
- enforce max row cap
- enforce statement timeout
- apply server-side limit if absent
- use read-only DB credentials

### MongoDB connector
- allowlist stages only (`$match`, `$group`, `$project`, `$sort`, `$limit`, `$count`, `$unwind` as approved)
- block dangerous operators / server-side JS
- cap output size
- read-only DB user

### Global safeguards
- workspace ownership checks everywhere
- prompt-injection hardening
- parameterization where possible
- sanitized logging
- secrets never sent to frontend

---

## 10) Multi-Tenancy

### Isolation model
Every persistent entity is workspace-scoped.

### Enforcement layers
1. application-level authorization
2. Postgres RLS on platform DB
3. connection ownership checks on every route
4. Redis rate limit per workspace
5. audit logging

### One active connection rule
Each session has exactly one active connection.
Switching connections starts a new session by default or requires explicit confirmation.

---

## 11) Data Model (Prisma Conceptual)

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String?
  createdAt    DateTime @default(now())
  memberships  WorkspaceMember[]
  sessions     QuerySession[]
}

model Workspace {
  id           String   @id @default(cuid())
  name         String
  slug         String   @unique
  plan         Plan     @default(FREE)
  createdAt    DateTime @default(now())
  members      WorkspaceMember[]
  connections  DataConnection[]
  sessions     QuerySession[]
  queryRuns    QueryRun[]
  usageEvents  UsageEvent[]
}

model WorkspaceMember {
  id           String        @id @default(cuid())
  workspaceId  String
  userId       String
  role         WorkspaceRole
  createdAt    DateTime      @default(now())

  workspace    Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
}

model DataConnection {
  id              String         @id @default(cuid())
  workspaceId     String
  name            String
  type            ConnectionType
  status          ConnectionStatus @default(ACTIVE)
  credentials     Json?
  schemaCache     Json?
  glossaryCache   Json?
  fileObjectKey   String?
  fileSizeBytes   Int?
  lastTestedAt    DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  sessions        QuerySession[]
  queryRuns       QueryRun[]
}

model QuerySession {
  id              String   @id @default(cuid())
  workspaceId      String
  userId           String
  connectionId     String
  title            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  workspace        Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  connection       DataConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  messages         QueryMessage[]
  queryRuns        QueryRun[]
}

model QueryMessage {
  id              String   @id @default(cuid())
  sessionId        String
  role             MessageRole
  content          Json
  createdAt        DateTime @default(now())

  session          QuerySession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

model QueryRun {
  id                String   @id @default(cuid())
  workspaceId       String
  connectionId      String
  sessionId         String
  userId            String
  question          String
  queryPlan         Json?
  compiledQuery     String?
  compiledPipeline  Json?
  responseKind      ResponseKind?
  chartSubtype      ChartSubtype?
  chartConfig       Json?
  rowCount          Int?
  durationMs        Int?
  cacheHit          Boolean  @default(false)
  status            QueryRunStatus
  errorCode         String?
  errorMessage      String?
  createdAt         DateTime @default(now())

  workspace         Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  connection        DataConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  session           QuerySession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  user              User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UsageEvent {
  id              String   @id @default(cuid())
  workspaceId      String
  queryRunId       String?
  kind             UsageEventKind
  units            Int
  createdAt        DateTime @default(now())

  workspace        Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum WorkspaceRole {
  OWNER
  ADMIN
  MEMBER
}

enum ConnectionType {
  POSTGRES
  MYSQL
  CSV
  EXCEL
  MONGODB
}

enum ConnectionStatus {
  ACTIVE
  ERROR
  DISABLED
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

enum ResponseKind {
  TEXT
  TABLE
  CHART
}

enum ChartSubtype {
  BAR
  LINE
  PIE
}

enum QueryRunStatus {
  SUCCESS
  FAILED
  BLOCKED
}

enum UsageEventKind {
  QUERY_EXECUTION
  STORAGE
}
```

---

## 12) API Contracts

### POST `/api/query`
```json
{
  "queryRunId": "qr_123",
  "sessionId": "sess_123",
  "compiledQuery": "SELECT customer_name, SUM(amount) AS revenue ...",
  "response": {
    "kind": "chart",
    "chartSubtype": "bar",
    "summary": "Acme Corp is the top customer this month by revenue.",
    "chartConfig": {
      "xKey": "customer_name",
      "yKey": "revenue",
      "title": "Top 10 Customers by Revenue"
    },
    "data": [
      { "customer_name": "Acme Corp", "revenue": 140000 }
    ]
  },
  "meta": {
    "rowCount": 10,
    "durationMs": 1840,
    "cacheHit": false,
    "privacyMode": "standard"
  }
}
```

### GET `/api/history`
Returns paginated query runs for the current workspace.

### POST `/api/upload`
Uploads CSV / Excel and returns a reusable `connectionId`.

### POST `/api/connections/[id]/test`
- validates credentials
- retrieves schema
- stores schema cache
- returns connection health

---

## 13) Format Decision Engine

### Canonical output contract
```ts
interface FormattedResponse {
  kind: 'text' | 'table' | 'chart'
  chartSubtype?: 'bar' | 'line' | 'pie'
  summary: string
  chartConfig?: {
    xKey: string
    yKey: string
    title: string
  }
  data: Record<string, unknown>[]
}
```

### Decision logic
Use deterministic heuristics first, LLM second.

#### Heuristics
- single scalar -> text
- time series -> line chart
- ranked categories -> bar chart
- part-of-whole with <= 8 buckets -> pie chart
- wide or detailed result sets -> table

This reduces cost and improves consistency.

---

## 14) Caching

### Cache key
Hash of:
- workspaceId
- connectionId
- normalized question
- schema version
- privacy mode

### Cache behavior
- successful responses cached
- cached responses do not count toward usage
- cache invalidated on schema refresh or connection change

---

## 15) Billing and Limits

### Free
- 100 successful uncached query runs / month
- smaller upload limit
- lower retention limits

### Pro
- higher query quota
- larger uploads
- multiple connections per workspace
- export features

### Enterprise
- custom quotas
- privacy mode defaults
- SSO / SCIM later
- audit exports
- custom support

---

## 16) Security

### Core requirements
- AES-256-GCM encryption for credentials
- key management only in server env / secret manager
- read-only external DB credentials
- RLS on platform DB
- strict IDOR checks
- audit logging for key actions
- sanitizer enforcement before execution
- sensitive-column masking before model calls

### Audit events
- connection created / updated / deleted
- connection tested
- query executed / blocked / failed
- member invited / role changed
- file uploaded / deleted

---

## 17) Evaluation Harness

### Test packs
1. relational question-answer pack
2. tabular upload pack
3. injection / safety pack
4. format-decision pack
5. latency / scale pack
6. Mongo beta pack

### Quality targets for GA v1
- >= 90% execution success on supported benchmark set
- <= 2% hallucinated column / table reference rate
- >= 85% answer correctness on gold result set tests
- >= 90% correct response-kind selection
- P95 end-to-end latency < 6 seconds on benchmark workloads

---

## 18) Milestone Plan

### M1 — Foundations + Relational Querying
- auth
- workspaces
- RBAC
- Postgres + MySQL connectors
- upload-based CSV / Excel connectors
- schema retrieval
- QueryPlan generation
- relational execution
- sessioned chat UI
- query history

### M2 — Smart Formatting + Exports
- deterministic format engine
- safe Claude summarization
- chart renderer
- table interactions
- export features
- usage tracking / billing
- monitoring / analytics

### M2.5 — Hardening
- privacy modes
- glossary / KPI layer
- schema refresh
- improved onboarding
- benchmark harness automation

### M3 — Future
- alerts / background monitoring
- dashboard pinning
- saved reports
- scheduled exports
- MongoDB GA if beta quality proves acceptable

---

## 19) Final Build Rules

1. Do not build v1 as SQL-only internally; use `QueryPlan`.
2. Do not promise cross-connection joins in v1.
3. Do not send unrestricted raw rows to the LLM.
4. Do not inject full schemas into prompts.
5. Do not rely on in-memory upload persistence in serverless.
6. Do treat uploaded files as reusable connections.
7. Do enforce one active connection per session.
8. Do use UI/UX Pro Max skill as the frontend implementation standard.
9. Do use claude-mem skill for efficient memory and token management during implementation work.
10. Do keep MongoDB behind beta / feature flag until quality is proven.
11. Do use answer correctness, not only SQL string match, as the primary quality metric.

