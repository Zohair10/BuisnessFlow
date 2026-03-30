# Buisness Flow

Conversational analytics SaaS for non-technical users to ask data questions in plain English and receive answers as text, tables, or charts.

## Features

- Natural-language analytics for non-technical teams
- Multi-tenant workspaces with RBAC (Owner, Admin, Member)
- Support for PostgreSQL, MySQL, CSV, and Excel data sources
- MongoDB support (Beta)
- Read-only querying with SQL safety enforcement
- Transparent query preview
- Multiple response formats: text, tables, and charts
- Export capabilities (CSV, PNG)
- Query caching for performance
- Privacy-first design with sensitive column masking
- Rate limiting per workspace
- Session-based chat history

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Recharts for visualizations
- Zustand for state management
- NextAuth.js v5 for authentication
- Prisma ORM
- Anthropic Claude API
- PostgreSQL (platform database)
- Redis (Upstash) for caching and rate limiting
- S3/R2 for file storage
- DuckDB for file querying

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database for platform data
- Anthropic API key
- (Optional) Redis for caching and rate limiting
- (Optional) S3 or R2 for file uploads
- (Optional) OAuth credentials for Google/GitHub

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `ANTHROPIC_API_KEY` - Your Anthropic API key
- `ENCRYPTION_KEY` - Generate with `openssl rand -base64 32`

Optional for full functionality:
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for caching
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` for file uploads
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` for Google OAuth
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` for GitHub OAuth

4. Set up the database:

```bash
npm run db:generate
npm run db:push
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

### Query Pipeline

1. User asks a question in natural language
2. System validates auth and workspace membership
3. Schema context is retrieved and relevant tables are selected
4. Claude generates a `QueryPlan` (generic IR)
5. `QueryPlan` is compiled to connector-specific query (SQL or MongoDB pipeline)
6. Safety enforcement (SQL sanitization or pipeline validation)
7. Query execution against the data source
8. Result normalization and sensitive column masking
9. Format decision (text/table/chart) using heuristics
10. Summary generation with Claude
11. Response stored and cached
12. Result returned to user

### Key Design Decisions

- **Generic QueryPlan IR**: Not SQL-only, supports MongoDB and future connectors
- **One connection per session**: Simplifies UX and prevents cross-source confusion
- **Schema retrieval**: Only relevant tables injected into prompts, not full schema
- **Privacy modes**: Standard (masked) and Strict (no raw rows to LLM)
- **File persistence**: CSV/Excel uploads stored in S3/R2 as reusable connections
- **Query caching**: Based on workspace, connection, question, schema version, and privacy mode
- **Billing on execution**: Only successful uncached queries count toward limits

## Project Structure

```
app/
  (auth)/              # Authentication pages
  (dashboard)/         # Main application pages
  api/                 # API routes
components/
  chat/                # Chat interface components
  connections/         # Connection management
  layout/              # Layout components
  ui/                  # shadcn/ui components
lib/
  ai/                  # AI pipeline (query planning, formatting, summarization)
  db/                  # Database connectors and query execution
  files/               # File upload and DuckDB materialization
  security/            # Encryption, redaction, rate limiting
  cache/               # Query result caching
  store/               # Zustand state management
prisma/
  schema.prisma        # Database schema
types/                 # TypeScript type definitions
```

## Security

- AES-256-GCM encryption for database credentials
- Read-only database credentials enforced
- SQL injection prevention via AST-based sanitization
- MongoDB pipeline stage allowlisting
- Sensitive column pattern matching and masking
- Row-level security on platform database
- Rate limiting per workspace
- Audit logging for key actions

## Workspace Roles

- **Owner**: Full control, billing, member management
- **Admin**: Connection management, member invites, analytics
- **Member**: Query execution, session creation, exports

## Supported Data Sources

### GA (v1)
- PostgreSQL
- MySQL
- CSV upload
- Excel upload

### Beta
- MongoDB (feature-flagged, requires schema sampling)

## Development

```bash
# Run development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start

# Open Prisma Studio
npm run db:studio
```

## Deployment

The application is designed for serverless deployment (Vercel, AWS Lambda, etc.) with:
- Stateless query execution
- External file storage (S3/R2)
- Connection pooling for databases
- Redis for distributed caching and rate limiting

## License

Proprietary - All rights reserved
