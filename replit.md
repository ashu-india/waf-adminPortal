# WAF Admin Dashboard

## Overview

This is a multi-tenant Web Application Firewall (WAF) administration dashboard built with a modern full-stack architecture. The application provides real-time monitoring, threat detection, and policy management for protecting multiple websites simultaneously. It features live traffic analysis, OWASP-compliant rule sets, customizable security policies, and comprehensive analytics with role-based access control.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for client-side routing (lightweight React Router alternative)
- TanStack Query (React Query) for server state management with aggressive caching (30-minute stale time)

**UI Component Library**
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Custom theme system supporting light/dark modes with localStorage persistence
- IBM Plex Sans and IBM Plex Mono as primary typefaces

**State Management Strategy**
- Server state managed via TanStack Query with optimistic updates
- Local UI state via React hooks (useState, useEffect)
- Server-Sent Events (SSE) for real-time traffic updates (replaced WebSocket for reliability)
- Theme state managed through React Context

**Key Design Patterns**
- Composition-based component architecture
- Custom hooks for reusable logic (useAuth, useSSE, useTheme)
- Centralized API client with consistent error handling
- Role-based UI rendering (admin, operator, viewer)

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- Session-based authentication using Passport.js with LocalStrategy
- In-memory session store (MemoryStore) for development
- CORS enabled for cross-origin requests

**Development vs Production**
- Development: Vite middleware integrated with Express for HMR
- Production: Pre-built static assets served from dist/public
- Separate entry points (index-dev.ts vs index-prod.ts)

**API Structure**
- RESTful API endpoints under /api prefix
- Role-based middleware (requireRole) for authorization
- Rate limiting middleware for login and sensitive endpoints
- Request validation using Zod schemas

**WAF Engine Components**
- Custom WAF engine with pattern matching (SQL injection, XSS, etc.)
- Reverse proxy server for intercepting and analyzing traffic
- Real-time SSE server for live traffic streaming (more reliable than WebSocket)
- Threat scoring system with configurable thresholds

### Data Storage

**Database**
- SQLite for development/demo (file-based: waf.db)
- Sequelize ORM for database abstraction
- Auto-sync models with database schema
- Configured to support PostgreSQL via Drizzle (schema defined but not actively used)

**Schema Design**
- Users: Authentication and role-based access (admin/operator/viewer)
- Tenants: Protected websites with domain, upstream URL, SSL config
- Policies: Security policies per tenant (enforcement mode, thresholds)
- WafRules: Custom security rules with patterns and severity levels
- Requests: Logged HTTP requests with full headers, body, metadata
- Analysis: Threat analysis results linked to requests
- Alerts: Security alerts triggered by high-risk requests
- Overrides: Manual allow/deny decisions for specific requests
- Webhooks: Integration endpoints for external notifications
- IpLists: Allow/deny lists for IP-based filtering

**Data Retention**
- Configurable retention period per tenant (default 30 days)
- IP anonymization after configurable period (default 7 days)
- Background job for cleaning old data (runs every 6 hours)
- Optional cookie and auth header scrubbing for privacy

### Authentication & Authorization

**Authentication Mechanism**
- Email-based authentication (no password in demo mode)
- Passport.js LocalStrategy for user verification
- Express session management with secure cookies
- Session persisted in memory store (development) or PostgreSQL (production)

**Authorization Levels**
- Admin: Full access to policies, rules, settings, user management
- Operator: Can view data and perform operational actions
- Viewer: Read-only access to dashboards and reports

**Security Features**
- Rate limiting on login endpoint (5 requests per minute)
- Input sanitization middleware
- CSRF protection via session secret
- XSS prevention through React's built-in escaping

### External Dependencies

**Database & ORM**
- Sequelize: ORM for SQLite (development)
- Drizzle ORM: Configured for PostgreSQL (not actively used)
- @neondatabase/serverless: Neon PostgreSQL driver
- SQLite: File-based database for demo/development

**UI Libraries**
- Radix UI: Headless component primitives (20+ components)
- Recharts: Charting library for analytics dashboards
- date-fns: Date formatting and manipulation
- Lucide React: Icon library

**Real-time Communication**
- Server-Sent Events (SSE) for live traffic streaming
- Native browser EventSource API for client-side SSE handling
- Simpler and more reliable than WebSocket (no connection cycling issues)

**Form Handling & Validation**
- react-hook-form: Form state management
- Zod: Schema validation
- @hookform/resolvers: Zod integration with react-hook-form

**Development Tools**
- Replit-specific plugins for development (vite-plugin-runtime-error-modal, cartographer, dev-banner)
- tsx: TypeScript execution for development server
- esbuild: Fast bundling for production build

**Third-party Integrations**
- Webhook system for external alert notifications
- Configurable webhook URLs for Slack, email, or custom endpoints
- Background jobs for triggering webhooks on high-severity alerts

**Session Storage**
- Production: PostgreSQL session store (connect-pg-simple)
- Development: In-memory session store (memorystore)

## Recent Changes

### Replit Environment Setup (Nov 28, 2025)
- **GitHub Import Configuration** for Replit environment
- **Setup Actions:**
  - Created `.gitignore` to exclude node_modules, dist, build artifacts, and SQLite database files
  - Configured Vite server to bind to 0.0.0.0:5000 with `allowedHosts: true` for Replit proxy compatibility
  - Set up development workflow to run on port 5000 with webview output type
  - Created missing WAF module implementations:
    - `server/waf/engine.ts` - WAF analysis engine with OWASP rule patterns (SQL injection, XSS, path traversal, command injection)
    - `server/waf/sse.ts` - Server-Sent Events server with proper headers and keep-alive support
    - `server/waf/proxy.ts` - Proxy stub for demo mode (uses ingress API endpoint instead)
  - Configured autoscale deployment with `npm run build` and `npm start`
- **Notes:**
  - WAF proxy runs in demo mode - for production, configure external reverse proxy to forward to `/api/waf/ingress`
  - Application uses SQLite for development (waf.db) with seeded demo users and tenant
  - Default users: admin@waf.local, operator@waf.local, viewer@waf.local

### SSE Migration (Nov 28, 2025)
- **Replaced WebSocket with Server-Sent Events (SSE)** for real-time traffic updates
- **Why:** WebSocket was experiencing connection cycling (abnormal closures with code 1006)
- **Solution:** Implemented simpler, more reliable SSE-based streaming
- **Files Changed:**
  - Created: `server/waf/sse.ts` - New SSE server implementation
  - Modified: `server/routes.ts` - Replaced WebSocket endpoints with SSE endpoint at `/api/traffic/stream`
  - Created: `client/src/hooks/useSSE.ts` - New SSE client hook using native EventSource API
  - Modified: `client/src/pages/traffic.tsx` - Switched from useWebSocket to useSSE
- **Benefits:**
  - No more connection cycling/reconnection loops
  - Simpler protocol (HTTP-based, no separate WebSocket upgrade)
  - Better browser compatibility
  - Automatic browser reconnection support
  - One-way server-to-client communication (perfect for traffic streaming)