# Quick Start Guide

Get Buisness Flow running locally in 5 minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` and add at minimum:

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/buisnessflow"
AUTH_SECRET="your-secret-here"  # Generate: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."
ENCRYPTION_KEY="your-key-here"  # Generate: openssl rand -base64 32

# Optional (for full functionality)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="buisnessflow-uploads"
```

## 3. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

## 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 5. Create Your First Account

1. Click "Sign up"
2. Enter your name, email, and password
3. You'll be automatically logged in with a default workspace

## 6. Add a Data Connection

### Option A: Upload a CSV/Excel File
1. Go to "Connections"
2. Click "New Connection"
3. Select "CSV Upload" or "Excel Upload"
4. Drag and drop your file
5. Give it a name and click "Create Connection"

### Option B: Connect a Database
1. Go to "Connections"
2. Click "New Connection"
3. Select "PostgreSQL" or "MySQL"
4. Enter connection details:
   - Host: `localhost` or your database host
   - Port: `5432` (PostgreSQL) or `3306` (MySQL)
   - Database: your database name
   - User: read-only user recommended
   - Password: database password
5. Click "Test Connection"
6. If successful, click "Create Connection"

## 7. Start Asking Questions

1. Go to "Chat"
2. Select your connection from the dropdown
3. Ask questions like:
   - "Show me the top 10 customers by revenue"
   - "What's the average order value this month?"
   - "How many users signed up each day last week?"
   - "Show me sales by product category"

## Tips

- Use the SQL preview to see the generated query
- Switch between chart, table, and text views
- Export results as CSV
- Export charts as PNG
- Create multiple sessions for different analyses
- View your query history in the History page

## Troubleshooting

**"No active workspace" error**
- Log out and log back in to refresh your session

**Connection test fails**
- Verify your database is running and accessible
- Check firewall rules
- Ensure credentials are correct
- For PostgreSQL/MySQL, try enabling SSL if required

**Query fails with safety error**
- The system only allows SELECT queries
- Ensure your question doesn't imply data modification
- Try rephrasing your question

**File upload fails**
- Ensure S3/R2 is configured in .env
- Check file size limits (25MB for Free plan)
- Verify file format (CSV or XLSX/XLS only)

**Charts don't render**
- Ensure your data has at least 2 columns
- Check that one column is numeric for bar/line charts
- Try switching to table view

## Next Steps

- Explore the Settings page to manage your workspace
- Invite team members (Owner/Admin only)
- Review your query history
- Try different question types to see various chart formats
- Check out the deployment guide in DEPLOYMENT.md
