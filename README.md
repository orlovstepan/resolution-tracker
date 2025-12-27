# 🎯 Resolution Tracker

A minimal web application to track yearly resolutions and monthly check-ins. Built with React + TypeScript (frontend) and Express + Prisma + SQLite (backend).

## Features

- ✅ **User Authentication** - Email/password signup & login with JWT cookies
- ✅ **Goals Management** - Create, update, delete goals with three types:
  - **Counter** - Track numeric progress (e.g., "Read 12 books")
  - **Binary** - Yes/no goals (e.g., "Visit UK")
  - **Rule** - Compliance tracking (e.g., "No sugar on weekdays")
- ✅ **Monthly Check-ins** - Record highlights, blockers, and notes each month
- ✅ **Goal Snapshots** - Automatically save goal states when creating check-ins
- ✅ **Progress Dashboard** - Visual summary of completed goals and progress
- ✅ **Responsive Design** - Works on desktop and mobile

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite (Prisma ORM)
- **Auth:** JWT with httpOnly cookies

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+

### Setup

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Create server/.env file
cd ../server
echo 'DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
CLIENT_URL="http://localhost:5173"' > .env

# 3. Initialize database
npx prisma generate
npx prisma db push

# 4. Start servers (in separate terminals)
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm run dev
```

App runs at **http://localhost:5173**

---

## 🌐 Deployment

### Option 1: Railway (Recommended)

Railway is the easiest option - one service for everything.

#### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/resolution-tracker.git
git push -u origin main
```

#### Step 2: Deploy on Railway
1. Go to [railway.app](https://railway.app) and create account
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables:
   ```
   DATABASE_URL=file:./data/prod.db
   JWT_SECRET=generate-a-secure-random-string-here
   NODE_ENV=production
   ```
5. Set build command: `cd client && npm install && npm run build && cd ../server && npm install && npx prisma generate && npx prisma db push`
6. Set start command: `cd server && node dist/index.js`
7. Deploy!

> **Note:** For SQLite persistence on Railway, mount a volume at `/app/server/prisma` and set `DATABASE_URL=file:./prisma/prod.db`

---

### Option 2: Render

#### Backend (Web Service)
1. Create a new Web Service on [render.com](https://render.com)
2. Connect your GitHub repo
3. Configure:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npx prisma generate && npx prisma db push && npm run build`
   - **Start Command:** `npm start`
4. Add environment variables:
   ```
   DATABASE_URL=file:./prod.db
   JWT_SECRET=your-secure-secret
   NODE_ENV=production
   CLIENT_URL=https://your-frontend-url.onrender.com
   ```

#### Frontend (Static Site)
1. Create a Static Site
2. Configure:
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. Add rewrite rule: `/*` → `/index.html` (for SPA routing)

---

### Option 3: Fly.io

#### Step 1: Install Fly CLI
```bash
brew install flyctl  # macOS
# or: curl -L https://fly.io/install.sh | sh
```

#### Step 2: Create fly.toml
```toml
app = "resolution-tracker"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"

[http_service]
  internal_port = 3001
  force_https = true

[[mounts]]
  source = "data"
  destination = "/app/server/prisma"
```

#### Step 3: Create Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install deps & build
COPY . .
RUN cd client && npm install && npm run build
RUN cd server && npm install && npx prisma generate && npm run build

# Runtime
WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "start"]
```

#### Step 4: Deploy
```bash
fly launch
fly secrets set JWT_SECRET=your-secure-secret
fly secrets set DATABASE_URL=file:./prisma/prod.db
fly deploy
```

---

### Option 4: Using PostgreSQL (Recommended for Production)

For production, PostgreSQL is more reliable than SQLite.

#### Step 1: Update Prisma Schema
Edit `server/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### Step 2: Get a PostgreSQL Database
- **Railway:** Add PostgreSQL plugin, copy connection string
- **Neon:** Free tier at [neon.tech](https://neon.tech)
- **Supabase:** Free tier at [supabase.com](https://supabase.com)

#### Step 3: Update Environment
```bash
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

#### Step 4: Migrate
```bash
cd server
npx prisma db push
```

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` or `postgresql://...` |
| `JWT_SECRET` | Secret for signing JWTs (use a long random string) | `a8f7d3k2m9x...` |
| `NODE_ENV` | Environment (`development` or `production`) | `production` |
| `CLIENT_URL` | Frontend URL (for CORS, only needed if separate) | `https://app.example.com` |
| `PORT` | Server port | `3001` |

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/me` - Get current user

### Goals
- `GET /api/goals` - List all goals
- `POST /api/goals` - Create goal
- `PATCH /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Check-ins
- `GET /api/checkins?month=YYYY-MM` - List check-ins
- `POST /api/checkins` - Create check-in
- `PATCH /api/checkins/:id` - Update check-in
- `DELETE /api/checkins/:id` - Delete check-in

---

## Project Structure

```
resolution-tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # UI components
│   │   ├── types/         # TypeScript types
│   │   └── styles.css     # Global styles
│   └── vite.config.ts
│
├── server/                 # Express backend
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── src/
│       ├── routes/        # API routes
│       └── middleware/    # Auth middleware
│
├── package.json           # Root package.json
└── README.md
```

## License

MIT
