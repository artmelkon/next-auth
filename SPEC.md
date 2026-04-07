# SPEC.md — Next.js Auth App

## 1. Project Overview

**Name:** Next.js Auth App  
**Purpose:** A foundational JWT-based authentication starter built with Next.js 16 App Router. It demonstrates stateless session management via HTTP-only cookies, sliding session expiration via middleware, and Server Actions for auth mutations.  
**Status:** Demo/foundational — core auth utilities are implemented; database integration is not yet wired up.

---

## 2. Technologies

| Category | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16.0.0 |
| UI Library | React | ^19.2.0 |
| Language | TypeScript | ^5 |
| JWT | jose | ^6.1.0 |
| Database Driver | mongodb | ^6.8.0 |
| Password Hashing | bcrypt | ^5.1.1 |
| Cookie Utility | cookie | ^0.6.0 |
| Linting | ESLint + eslint-config-next | ^8 / 13.5.6 |

> `mongodb`, `bcrypt`, and `jsonwebtoken` are installed but not yet integrated into the runtime code.

---

## 3. Project Structure

```
next-auth/
├── _utils/
│   ├── auth.ts              # Core auth logic: encrypt, decrypt, login, logout, getSession, updateSession
│   └── middleware.ts        # Next.js middleware — delegates to updateSession()
├── app/
│   ├── _component/          # (empty) Reserved for shared React components
│   ├── _context/            # (empty) Reserved for React Context providers
│   ├── layout.tsx           # Root layout: sets page title and metadata
│   └── page.tsx             # Main page: login/logout forms, session display
├── public/
│   ├── styles/
│   │   └── glogals.css      # Global CSS reset and base styles
│   ├── next.svg
│   └── vercel.svg
├── mocks/                   # (empty) Reserved for test mock data
├── tests/                   # (empty) Reserved for test files
├── .env.local               # Local environment variables (not committed)
├── next.config.js           # Next.js config: env vars, experimental serverActions
├── tsconfig.json            # TypeScript config with path aliases
├── .eslintrc.json           # ESLint config
└── package.json
```

---

## 4. Architecture

- **App Router** — all pages live under `app/`. No `pages/` directory.
- **Server Actions** — login and logout are `async` functions marked `"use server"`, called directly from form `action` props.
- **Stateless Sessions** — session state lives entirely in a signed JWT stored in an HTTP-only cookie named `session`. No server-side session store.
- **Sliding Expiration** — Next.js middleware runs `updateSession()` on every request to refresh the cookie's TTL.
- **Database** — MongoDB is the intended backing store (driver installed, connection not yet implemented).

---

## 5. Authentication Flow

```
1. User fills in email → submits login form
2. Server Action: login(formData)
   └─ Builds session object: { user: { email }, expires: now + 20s }
   └─ Signs JWT with HS256 using SECRET_KEY
   └─ Writes JWT to HTTP-only cookie "session" (maxAge: 20s)
3. Every subsequent request hits middleware
   └─ updateSession(req) decrypts token
   └─ If valid → re-signs with new expiry (now + 20s) → updates cookie
   └─ If expired/invalid → session is not renewed (user is effectively logged out)
4. getSession() reads and decrypts the cookie for server-side use
5. logout() sets cookie expiry to epoch → browser discards it
```

---

## 6. Server Actions & Utilities

All auth logic lives in `_utils/auth.ts`. Import via the `@utils/*` path alias.

| Function | Signature | Description |
|---|---|---|
| `encrypt` | `(payload: any) => Promise<string>` | Signs a JWT with HS256, 20s expiry |
| `decrypt` | `(token: string) => Promise<any \| null>` | Verifies JWT; returns payload or `null` on error/expiry |
| `login` | `(formData: FormData) => Promise<void>` | Extracts email, creates session cookie |
| `logout` | `() => Promise<void>` | Clears session cookie |
| `getSession` | `() => Promise<any \| null>` | Returns current session payload or `null` |
| `updateSession` | `(req: NextRequest) => Promise<NextResponse \| undefined>` | Middleware helper: refreshes session TTL |

**Middleware** (`_utils/middleware.ts`) exports a `middleware` function that wraps `updateSession`. It runs on every route by default.

---

## 7. Database Schema (Planned)

**Database:** `nextauth` (MongoDB)

### `users` Collection

| Field | Type | Description |
|---|---|---|
| `_id` | `ObjectId` | Auto-generated primary key |
| `email` | `string` | User's email address (unique) |
| `passwordHash` | `string` | bcrypt-hashed password |
| `createdAt` | `Date` | Account creation timestamp |

> Currently no database connection is established. The MongoDB driver (`mongodb@6.8.0`) and bcrypt (`bcrypt@5.1.1`) are installed and ready to wire in.

---

## 8. Environment Variables

| Variable | Example Value | Purpose |
|---|---|---|
| `DB_URI` | `mongodb://localhost:27017/nextauth` | MongoDB connection string |
| `SECRET_KEY` | `KwGkhcfhPTQZWhiEOhes8q4msY3PkJWkGY1rZXggReM=` | HMAC-SHA256 key for signing JWTs |

Defined in `.env.local` (local dev) and exposed to the server via `next.config.js` `env` block.

> **Never expose `SECRET_KEY` to the client.** Do not prefix it with `NEXT_PUBLIC_`.

---

## 9. Configuration

### TypeScript Path Aliases (`tsconfig.json`)

| Alias | Resolves To |
|---|---|
| `@utils/*` | `./_utils/*` |
| `components/*` | `./app/_components/*` |
| `@ctx/*` | `./app/_context/*` |
| `@/*` | `./*` |

### Next.js (`next.config.js`)

```js
experimental: { serverActions: true }  // enables Server Actions
env: { DB_URI, SECRET_KEY }            // makes env vars available server-side
```

---

## 10. Development Guidelines

1. **Auth mutations must be Server Actions** — use `"use server"` and call from form `action` props.
2. **Never expose secrets client-side** — `SECRET_KEY` and `DB_URI` must remain server-only.
3. **Hash passwords with bcrypt** — never store plaintext passwords; use `bcrypt.hash()` before writing to MongoDB.
4. **Validate credentials on login** — the current `login()` function accepts any email. Before production, look up the user in MongoDB and verify the password hash.
5. **Adjust session TTL for production** — the current 20-second expiry is for demo purposes. Use a longer window (e.g., 30 minutes) in production.
6. **Extend via middleware** — any session-aware logic (role checks, redirects) belongs in `_utils/middleware.ts`.
7. **Path aliases** — use `@utils/auth` instead of relative `../../_utils/auth` imports.

---

## 11. Available Scripts

```bash
npm run dev      # Start development server (next dev)
npm run build    # Production build (next build)
npm run start    # Start production server (next start)
npm run lint     # Run ESLint (next lint)
```

---

## 12. Known Issues & TODOs

| # | Issue | Notes |
|---|---|---|
| 1 | No credential validation in `login()` | Any email is accepted; must validate against DB |
| 2 | MongoDB not connected | Driver installed; needs client setup and connection logic |
| 3 | Session TTL is 20 seconds | Demo only; increase for production use |
| 4 | Typo: `metadata` in `layout.tsx` | Variable named `metadat` — cosmetic bug |
| 5 | Typo: `cookyStore` in `logout()` | Should be `cookieStore` |
| 6 | Typo: `glogals.css` | Should be `globals.css` |
| 7 | Typo: `monodb://` in `.env.local` | Should be `mongodb://` |
| 8 | `_component/`, `_context/`, `mocks/`, `tests/` are empty | Scaffold directories, not yet populated |
