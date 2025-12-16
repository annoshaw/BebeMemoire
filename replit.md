# Memoria - Baby Memory Book Application

## Overview

Memoria is a mobile-first web application designed for parents to create, store, and print personalized baby memory books. It allows users to document pregnancy and childhood milestones with photos, videos, and text, including QR code generation for video content in printed books. The platform supports diverse family structures and aims to provide a comprehensive and inclusive memory-keeping solution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is built with **React 18** and **TypeScript**, using **Vite** for fast development and optimized builds. **Wouter** handles routing, and **TanStack Query** manages server state. The UI is styled with **Tailwind CSS v4** and **Shadcn/ui** components, featuring a custom design system with a warm, earthy color palette. **Framer Motion** provides animations. State management is handled by **Zustand**, storing book editor data like language preferences, current selections, and page content. Utility functions include `paletteExtractor` for color analysis, `contrastChecker` for accessibility, and `pdfExporter` for generating PDF outputs. A parallel **Flutter Web** frontend is under development in `/flutter_app/`, providing an alternative mobile-first experience with `provider` for state management and an onboarding wizard.

### Backend

The backend is an **Express.js** REST API server built with **Node.js** and **TypeScript**. It supports both development (Vite integration) and production environments. Authentication is handled via **Replit Auth** (OpenID Connect) and **Passport.js**, with session management using **Express Session** and a PostgreSQL store. Secure, HTTP-only cookies are used for session persistence. Middleware enforces authentication (`requireAuth`) for protected routes.

### Data Storage

**PostgreSQL** (Neon serverless) is the primary database, accessed via **Drizzle ORM** for type-safe queries. The schema defines tables for `sessions`, `users`, `books`, `notificationSettings`, `memories`, `userPlans` (for subscription tiers), and `qrCodes`. A repository pattern separates business logic from data access.

### API Structure

The API includes authentication endpoints (e.g., `GET /api/auth/user`) and RESTful resource endpoints for CRUD operations on books, memories, user plans, and QR codes. A key feature is "Inspiration Pages," allowing users to add custom template pages to their books. API routes are authenticated via session-based middleware.

### Admin Dashboard

An administration dashboard is accessible at `/app/admin` for users with `role = 'admin'`. It includes sections for `Overview` (KPIs, stats), `Orders` (management), `Users` (management), and `PDF Exports` (tracking). It features analytics charts for user demographics, order regions, and product types. Admins can also manage email campaigns with audience filtering and history tracking. Server-side PDF generation uses Puppeteer, with PDFs uploaded to AWS S3 and accessed via signed URLs.

### Automated Processes

The system includes automated order management for "payment pending" orders, which are cancelled after 14 days without payment. Subscription reminders are sent once to users without paid plans 14 days after registration. An hourly cleanup job handles these processes.

### PDF/Order Status Synchronization

PDF export status and order status are synchronized with manual override priority:
- **Status values**: pending, generating, completed, downloaded, sent, failed
- **Automatic sync**: PDF 'downloaded' → Order 'processing', PDF 'sent' → Order 'shipped'
- **Manual override**: Admin status changes set `manualOverride=true`, preventing automatic updates
- **Reset**: Optional `resetManualOverride` flag to re-enable automatic sync
- Failures always update status regardless of override (safety measure)

### Security Features

- **Helmet**: CSP headers with stricter policy in production (no unsafe-eval/inline)
- **Rate limiting**: Applied before body parsing to prevent DoS attacks
  - Auth routes: 20 requests / 15 min
  - Password reset: 10 requests / hour
  - API/Admin: 100 requests / min
- **Webhook verification**: Stripe signature validation with proper error propagation
- **Health check**: GET /api/health monitors database, Stripe, S3, email services

## External Dependencies

### Third-Party Services

-   **Replit Auth (OpenID Connect)**: Primary authentication provider.
-   **Neon Database**: Serverless PostgreSQL hosting.
-   **Google Fonts**: Provides Fraunces and DM Sans typography.
-   **MailerSend**: For transactional email sending (e.g., password reset, order cancellations, subscription confirmations, plan changes, price adjustments, discount notifications).
-   **AWS S3**: For storing generated PDFs.

### Key npm Packages

-   **bcryptjs**: Password hashing.
-   **date-fns**: Date manipulation.
-   **nanoid**: Unique ID generation.
-   **zod**: Runtime schema validation.
-   **drizzle-zod**: Zod schema generation from Drizzle.
-   **Puppeteer**: Server-side PDF rendering.