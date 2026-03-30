# Deployment Checklist

## Pre-Deployment

### Environment Variables
- [ ] `DATABASE_URL` - PostgreSQL connection string (Neon/Supabase recommended)
- [ ] `AUTH_SECRET` - Generated with `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` - Production URL
- [ ] `ANTHROPIC_API_KEY` - Claude API key
- [ ] `ENCRYPTION_KEY` - Generated with `openssl rand -base64 32`
- [ ] `UPSTASH_REDIS_REST_URL` - Redis URL for caching
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Redis token
- [ ] `AWS_ACCESS_KEY_ID` - S3/R2 access key
- [ ] `AWS_SECRET_ACCESS_KEY` - S3/R2 secret key
- [ ] `AWS_REGION` - S3 region
- [ ] `S3_BUCKET_NAME` - Bucket for file uploads
- [ ] OAuth credentials (optional)

### Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### Build Verification
```bash
# Run linter
npm run lint

# Build for production
npm run build
```

## Deployment Platforms

### Vercel (Recommended)
1. Connect GitHub repository
2. Add environment variables in project settings
3. Deploy

### AWS Lambda / Serverless
1. Configure serverless.yml or CDK
2. Set up RDS PostgreSQL
3. Configure S3 bucket
4. Set up Redis (ElastiCache or Upstash)
5. Deploy with `serverless deploy` or CDK

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Post-Deployment

### Verification
- [ ] Test user registration
- [ ] Test login (credentials + OAuth)
- [ ] Create a workspace
- [ ] Add a database connection
- [ ] Test connection
- [ ] Create a chat session
- [ ] Run a test query
- [ ] Verify chart rendering
- [ ] Test CSV upload
- [ ] Test export functionality
- [ ] Verify rate limiting
- [ ] Check query caching

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (PostHog)
- [ ] Set up uptime monitoring
- [ ] Configure log aggregation
- [ ] Set up database backups

### Security
- [ ] Enable HTTPS
- [ ] Configure CORS if needed
- [ ] Review database credentials (read-only)
- [ ] Test SQL injection prevention
- [ ] Verify sensitive column masking
- [ ] Enable audit logging

## Scaling Considerations

### Database
- Use connection pooling (PgBouncer for PostgreSQL)
- Enable read replicas for heavy workloads
- Monitor query performance
- Set up automated backups

### Redis
- Use Redis cluster for high availability
- Monitor cache hit rates
- Adjust TTL based on usage patterns

### File Storage
- Enable CDN for file downloads
- Set up lifecycle policies for old files
- Monitor storage costs

### Rate Limiting
- Adjust limits per plan tier
- Monitor rate limit hits
- Consider per-user limits for fairness

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors**
- Run `npm run db:generate` to regenerate Prisma client
- Clear `.next` folder and rebuild

**Database connection fails**
- Verify DATABASE_URL format
- Check network access (whitelist IPs)
- Ensure database is running

**File uploads fail**
- Verify S3/R2 credentials
- Check bucket permissions
- Ensure bucket exists

**Queries fail with safety errors**
- Review sanitize-sql.ts rules
- Check for unsupported SQL patterns
- Verify read-only credentials

**MongoDB queries fail**
- Ensure MongoDB is enabled (beta flag)
- Verify connection URI format
- Check collection names in schema

## Performance Optimization

- Enable Redis caching
- Use CDN for static assets
- Optimize database indexes
- Monitor Claude API usage
- Implement query result pagination
- Use database connection pooling

## Backup Strategy

- Daily automated database backups
- Retain backups for 30 days minimum
- Test restore procedures quarterly
- Document recovery procedures
- Back up encryption keys securely
