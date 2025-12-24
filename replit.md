# TypeMasterAI

## Overview

TypeMasterAI is a comprehensive AI-powered typing test platform built with a React frontend and Express.js backend. The application offers multiple typing modes including standard tests, code typing, book typing, dictation, stress tests, and real-time multiplayer racing. It features AI-generated content, competitive ELO ratings, achievement systems, and detailed keystroke analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript and Vite as the build tool
- **Styling**: TailwindCSS v4 with Shadcn UI component library (New York style)
- **State Management**: TanStack React Query for server state
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **Build Output**: Compiled to `dist/public/` directory

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Structure**: RESTful endpoints registered in `server/routes.ts`
- **WebSocket**: Real-time multiplayer racing via `server/websocket.ts`
- **Session Management**: Express-session with PostgreSQL store (connect-pg-simple)
- **Authentication**: Passport.js with Local, Google, GitHub, and Facebook strategies
- **Build**: esbuild bundles server code to `dist/index.js`

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Neon serverless PostgreSQL driver (@neondatabase/serverless)
- **Schema**: Defined in `shared/schema.ts` with Zod validation via drizzle-zod
- **Migrations**: Output to `./migrations/` directory via `drizzle-kit push`

### Key Services
- **AI Integration**: OpenAI GPT-4o for paragraph generation, code snippets, chat, and feedback analysis
- **Email**: Mailgun for transactional emails (password reset, verification)
- **Push Notifications**: Web Push with VAPID keys (requires environment configuration)
- **Caching**: In-memory caching for leaderboards (`server/leaderboard-cache.ts`) and race data (`server/race-cache.ts`)
- **Rate Limiting**: Express-rate-limit for API endpoints, custom WebSocket rate limiter

### Real-time Features
- **Multiplayer Racing**: WebSocket-based race rooms with bot opponents
- **Bot System**: AI-generated realistic usernames and human-like typing simulation
- **Anti-Cheat**: Keystroke validation and WPM verification (`server/anticheat-service.ts`)

### Security
- **Password Hashing**: bcryptjs
- **OAuth State Management**: PKCE flow with secure state tokens
- **CSRF Protection**: Custom middleware in `server/auth-security.ts`
- **Input Sanitization**: DOMPurify for XSS prevention

## External Dependencies

### Database
- **PostgreSQL**: Primary database via Neon serverless driver
- **Environment Variable**: `DATABASE_URL` required for connection

### AI Services
- **OpenAI API**: Used via Replit AI Integrations or direct API key
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` or `OPENAI_API_KEY`, `OPENAI_BASE_URL`

### Email Service
- **Mailgun**: Transactional email delivery
- **Environment Variables**: Mailgun API credentials required for email features

### Push Notifications
- **Web Push (VAPID)**: Browser push notifications
- **Environment Variables**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- **Note**: Application runs without VAPID keys but push notifications will be disabled

### OAuth Providers
- **Google OAuth**: Social login
- **GitHub OAuth**: Social login
- **Facebook OAuth**: Social login
- **Environment Variables**: Client IDs and secrets for each provider

### Certificate Signing
- **Environment Variable**: `CERTIFICATE_SECRET` (required in production, min 32 characters)

## Dictation Mode - Challenge Mode

### Overview
Challenge Mode in Dictation (`/dictation-mode`) offers a focused practice experience with timed challenges.

### Features
- **Time Limit Preview**: Shows estimated time limit on setup screen before starting (uses CHALLENGE_TIMING formula)
- **Streak Tracking**: Consecutive completions tracked with bonuses (2% per streak, max 10%)
- **Prefetch Error Handling**: 3 retry attempts with user-facing toast on failure
- **Difficulty Levels**: Easy, Medium, Hard affect sentence complexity and time limits:
  - Easy: 25 WPM target, 2.5x buffer (~8 words/sentence)
  - Medium: 40 WPM target, 1.8x buffer (~14 words/sentence)
  - Hard: 60 WPM target, 1.4x buffer (~22 words/sentence)

### Key Files
- `client/src/features/dictation/types.ts` - CHALLENGE_TIMING constants (timing formula, difficulty config)
- `client/src/pages/dictation-mode.tsx` - Main dictation mode page with time preview calculation
- `client/src/features/dictation/components/ChallengeTimePreview.tsx` - Time Limit preview card component
- `client/src/features/dictation/context/DictationContext.tsx` - Session stats management