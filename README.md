# 🎯 Resolution Tracker

A minimal web application to track yearly resolutions and monthly check-ins. Built with React + TypeScript (frontend) and Express + Prisma + SQLite (backend).

![Resolution Tracker](https://img.shields.io/badge/Status-Ready-brightgreen)

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
- **Database:** SQLite (with Prisma ORM)
- **Auth:** JWT with httpOnly cookies
- **Styling:** CSS Modules

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### 1. Clone and Install

```bash
# Clone the repository
cd resolution-tracker

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

Create a `.env` file in the `server` directory:

```bash
# server/.env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-key-change-in-production"
CLIENT_URL="http://localhost:5173"
```

### 3. Initialize Database

```bash
cd server
npx prisma generate
npx prisma db push
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

The app will be available at `http://localhost:5173`

## Default Goals

When you sign up, the following goals are created automatically:

| Goal | Type | Target |
|------|------|--------|
| €10k additional income | Counter | €10,000 |
| Chatbot users | Counter | 1,000 users |
| Drumming hours | Counter | 50 hours |
| Piano classes | Counter | 20 classes |
| No added sugar on weekdays | Rule | 100% |
| Find new job | Binary | - |
| Arabic A1 | Binary | - |
| Spanish B2 | Binary | - |
| Splits | Binary | - |
| Visit UK | Binary | - |
| Language platform first users | Counter | 20 users |

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

## Deployment

### Railway

1. Create a new Railway project
2. Add a PostgreSQL database (or use SQLite with persistent storage)
3. Set environment variables:
   - `DATABASE_URL` - Your database connection string
   - `JWT_SECRET` - A secure random string
   - `CLIENT_URL` - Your frontend URL
4. Deploy the backend from the `server` directory
5. Deploy the frontend from the `client` directory (or build and serve statically)

### Render

1. Create a Web Service for the backend
2. Create a Static Site for the frontend
3. Set up environment variables as above
4. Use `npm run build && npm start` as the build command for backend

### Vercel (Frontend) + Railway (Backend)

1. Deploy frontend to Vercel pointing to `client` directory
2. Deploy backend to Railway pointing to `server` directory
3. Update `CLIENT_URL` and API proxy settings accordingly

### Using PostgreSQL in Production

Update the Prisma schema for PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then run:
```bash
npx prisma generate
npx prisma db push
```

## Project Structure

```
resolution-tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/    # React components
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app component
│   │   ├── main.tsx       # Entry point
│   │   └── styles.css     # Global styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── server/                 # Express backend
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   ├── src/
│   │   ├── lib/           # Shared utilities
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   └── index.ts       # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

## License

MIT
