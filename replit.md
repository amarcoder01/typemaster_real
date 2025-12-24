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

## Dictation Mode - Challenge Mode Timing

### Overview
Challenge Mode in Dictation (`/dictation-mode`) features time-based typing challenges with consequences for timeouts.

### Time Calculation (Industry-Standard WPM-Based)
- **Formula**: `Time = (WordCount / TargetWPM) × BufferFactor × 60 seconds`
- **Difficulty Configs**:
  - Easy: Target 25 WPM, Buffer 2.5x (generous ~2.4s per word)
  - Medium: Target 40 WPM, Buffer 1.8x (standard ~1.35s per word)
  - Hard: Target 60 WPM, Buffer 1.4x (challenging ~0.7s per word)
- **Example Times (10-word sentence)**:
  - Easy: 60 seconds
  - Medium: 27 seconds
  - Hard: 14 seconds
- **Time Caps**: Minimum 5 seconds, Maximum 3 minutes
- **Grace Period**: 3 seconds after time expires before auto-submit

### Input Validation
- Empty/invalid sentences return minimum time (5 seconds)
- Word count minimum: 1 (uncapped, MAX_TIME_MS handles long sentences)
- Unknown difficulty values fall back to medium

### Overtime Penalty System
- **Graduated Penalty**: 5% base + 1% per second overtime
- **Maximum Penalty**: 30% cap
- **Function**: `calculateOvertimePenalty(secondsOver)` returns penalty as decimal (0.05 to 0.30)

### Features
- **Countdown Timer**: Visible in header during active typing (format M:SS)
- **Visual Warnings**: Yellow at 10 seconds, Red at 5 seconds with pulsing animation
- **Auto-Submit**: Submits answer when grace period expires
- **Time's Up Overlay**: Modal showing timeout status with dismiss button
- **Streak Tracking**: Consecutive completions tracked with bonuses (2% per streak, max 10%)
- **Prefetch Error Handling**: 3 retry attempts with user-facing toast on failure

### Key Files
- `client/src/features/dictation/types.ts` - CHALLENGE_TIMING constants, calculateTimeLimit, calculateOvertimePenalty
- `client/src/pages/dictation-mode.tsx` - Timer display, Time's Up overlay, prefetch settings tracking
- `client/src/features/dictation/context/DictationContext.tsx` - Session stats management