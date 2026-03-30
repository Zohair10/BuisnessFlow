# Quick Setup Steps

## 1. Fill in your .env file

I've created a `.env` file with pre-generated secrets. You need to add:

### Required (Minimum to run):
```bash
# 1. DATABASE_URL - Get a free PostgreSQL database:
#    - Neon: https://neon.tech (recommended, instant setup)
#    - Supabase: https://supabase.com
#    - Railway: https://railway.app
DATABASE_URL="postgresql://user:password@host:5432/database"

# 2. ANTHROPIC_API_KEY - Get from https://console.anthropic.com/
ANTHROPIC_API_KEY="sk-ant-YOUR_KEY_HERE"
```

The AUTH_SECRET and ENCRYPTION_KEY are already generated for you!

### Optional (for full features):
- Redis (caching): https://upstash.com - free tier available
- S3/R2 (file uploads): AWS or Cloudflare R2
- OAuth: Google/GitHub developer consoles

## 2. Set up the database

```bash
npm run db:generate
npm run db:push
```

## 3. The dev server is already running!

Open http://localhost:3000 - it will now redirect to /login

## 4. Create your first account

1. Click "Sign up"
2. Enter your name, email, and password
3. You'll be auto-logged in with a default workspace

## 5. Test the app

Without Redis/S3 (minimal setup):
- ✅ Login/signup works
- ✅ Chat interface works
- ✅ PostgreSQL/MySQL connections work
- ✅ Query execution works
- ✅ Charts, tables, text responses work
- ❌ Query caching disabled (will still work, just slower)
- ❌ File uploads disabled (CSV/Excel won't work)

With Redis + S3 (full setup):
- ✅ Everything works including caching and file uploads

## Quick Test Flow

1. Sign up → Creates account + default workspace
2. Go to Connections → Add a PostgreSQL or MySQL database
3. Test connection → Should show "Connection successful"
4. Go to Chat → Select your connection
5. Ask: "Show me the first 10 rows"
6. See the response as a table with export options

## Troubleshooting

**"No active workspace" error**
- This happens on first login. The registration creates a default workspace automatically.
- If you see this, log out and log back in.

**Connection test fails**
- Verify your database is accessible from your machine
- Check firewall rules
- Ensure credentials are correct

**"ANTHROPIC_API_KEY not set" error**
- Make sure you've added your Claude API key to .env
- Restart the dev server after adding it
