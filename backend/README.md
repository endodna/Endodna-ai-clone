# BiosAI Backend

A Node.js backend built with TypeScript, Express, and Prisma for the BiosAI platform.

## Tech Stack

- **Node.js** with TypeScript
- **Express.js** for web framework
- **Prisma** for database ORM
- **Supabase** for PostgreSQL database
- **JWT** for authentication
- **Zod** for schema validation
- **Redis** for caching
- **Docker** for containerization

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start with Docker Compose
npm run docker:dev
```

## Environment Variables

Create a `.env` file with:

```
DATABASE_URL=your-supabase-database-url
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://localhost:6379
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Features

- JWT authentication with Supabase
- Prisma database integration
- Redis caching
- Zod validation
- Docker containerization
- Service JWT for Lambda functions