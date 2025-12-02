# Memoria - Baby Memory Book Application

## Overview

Memoria is a modern mobile-first web application for parents to create, store, and print personalized baby memory books. The platform allows users to document their pregnancy journey and child's milestones through photos, videos, and text entries, with the ability to generate QR codes for video content in printed editions. The application supports diverse family structures including traditional births, adoptions, IVF journeys, and perinatal loss.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server for fast HMR and optimized production builds
- **Wouter** for lightweight client-side routing (replacing React Router)
- **TanStack Query** (React Query) for server state management, caching, and data synchronization

**UI & Styling**
- **Tailwind CSS v4** (via @tailwindcss/vite plugin) for utility-first styling
- **Shadcn/ui** component library (Radix UI primitives) providing accessible, customizable components in "new-york" style
- **Framer Motion** for animations and page transitions
- **Lucide Icons** as the icon library
- Custom design system with warm, earthy color palette (sage green primary, terracotta secondary)
- Responsive mobile-first design philosophy

**Component Organization**
- `/client/src/components/ui/` - Shadcn UI components (buttons, forms, dialogs, etc.)
- `/client/src/components/layout/` - Layout components (Navbar, Footer)
- `/client/src/pages/` - Route-level page components
- Path aliases configured: `@/` → client/src, `@shared/` → shared, `@assets/` → attached_assets

### Flutter Web Frontend (Parallel Development)

**Location**: `/flutter_app/` - Alternative mobile-first Flutter web frontend accessible at `/flutter/`

**Framework & Build**
- **Flutter 3.22+** with Dart for cross-platform development
- **Flutter Web** compiled output served from `/flutter/` route
- Uses `provider` package for state management

**Key Components**
- `/flutter_app/lib/screens/` - Screen components (LoginScreen, HomeScreen, OnboardingWizardScreen)
- `/flutter_app/lib/providers/` - State providers (AuthProvider, BooksProvider, OnboardingProvider, LocaleProvider)
- `/flutter_app/lib/services/` - API service for backend communication
- `/flutter_app/lib/theme/` - Custom theme with AppColors

**Onboarding Flow**
- Multi-step wizard for new users after registration
- Step 1: Book type selection (born/expecting/adoption)
- Step 2: Child name and optional gender
- Step 3: Relevant date (birth/due/adoption date)
- Step 4: Notification frequency preference
- Creates first book and notification settings on completion

**Build Command**: `cd flutter_app && flutter build web --base-href="/flutter/"`

### Backend Architecture

**Server Framework**
- **Express.js** REST API server running on Node.js
- **TypeScript** with ES modules for modern JavaScript features
- Custom HTTP request logging middleware tracking request duration and responses

**Development vs Production**
- Development: Vite middleware integrated with Express for HMR
- Production: Static file serving from pre-built `dist/public` directory
- Build process bundles server code with esbuild, selectively bundling dependencies to reduce cold starts

**Authentication & Session Management**
- **Replit Auth** (OpenID Connect) as the primary authentication provider
- **Passport.js** with OpenID Client strategy for authentication flow
- **Express Session** with PostgreSQL session store (connect-pg-simple)
- Session-based authentication with 1-week cookie lifetime
- Secure cookies (httpOnly, secure flags enabled)
- Custom middleware (`requireAuth`, `isAuthenticated`) for route protection

### Data Storage

**Database**
- **PostgreSQL** (Neon serverless) as the primary database
- **Drizzle ORM** for type-safe database queries and schema management
- Database connection via `@neondatabase/serverless` HTTP driver
- Schema location: `shared/schema.ts`
- Migration output directory: `./migrations`

**Database Schema Design**
- **sessions** - Passport session storage with expiry index
- **users** - User profiles supporting both email and OAuth (Replit) authentication
  - Fields: id, email, password (hashed), fullName, firstName, lastName, profileImageUrl, address, gender, phone, country, authProvider, onboardingCompleted, timestamps
- **books** - Baby book/album records linked to users
  - Fields: id, userId (foreign key), childName, coverImage, birthDate, babyStatus (born/expecting/adoption), timestamps
- **notificationSettings** - User notification preferences
  - Fields: userId, emailNotifications, pushNotifications, milestoneReminders, notificationFrequency (daily/weekly/monthly/none), timestamps
- **memories** - Individual memory entries within books
  - Fields: id, bookId (foreign key), content, media references, timestamps
- **userPlans** - Subscription tier management (Free, Premium, Platine)
  - Storage limits: Free (1GB photos), Premium (2GB video + unlimited photos), Platine (5GB video + unlimited photos)
- **qrCodes** - QR code generation tracking for video content in printed books
  - Fields: memoryId (foreign key), QR code URL/data

**Storage Layer Abstraction**
- `IStorage` interface defining all data operations
- `DatabaseStorage` class implementing the interface with Drizzle ORM
- Repository pattern separating business logic from data access

### API Structure

**Authentication Endpoints**
- `GET /api/auth/user` - Get current authenticated user (Replit Auth)
- OAuth flow managed by Replit Auth setup (login, logout, callback routes)

**Resource Endpoints** (Pattern: RESTful design)
- Books CRUD operations
- Memories CRUD operations
- User plan management
- QR code generation and retrieval

All API routes require authentication via session-based middleware.

### External Dependencies

**Third-Party Services**
- **Replit Auth (OpenID Connect)** - Primary authentication provider
- **Neon Database** - Serverless PostgreSQL hosting
- **Google Fonts** - Fraunces (serif) and DM Sans (sans-serif) typography

**Note: AI Features Removed**
- OpenAI integration was configured but has been removed per user request to conserve Replit credits
- Removed features: AI-generated family tree backgrounds, spell-checker and grammar corrector
- Family tree backgrounds now use pre-made static images only

**Key npm Packages**
- **bcryptjs** - Password hashing (for email auth fallback)
- **date-fns** - Date manipulation and formatting
- **nanoid** - Unique ID generation for cache busting and identifiers
- **zod** - Runtime schema validation
- **drizzle-zod** - Zod schema generation from Drizzle tables

**Development Tools**
- **@replit/vite-plugin-cartographer** - Development navigation (Replit env only)
- **@replit/vite-plugin-dev-banner** - Development banner (Replit env only)
- **@replit/vite-plugin-runtime-error-modal** - Runtime error overlay
- Custom meta images plugin for OpenGraph/Twitter card image injection

**Build Dependencies**
- **esbuild** - Server-side bundling with selective dependency inclusion
- **tsx** - TypeScript execution for development and build scripts
- **drizzle-kit** - Database migration management (`npm run db:push`)

### Deployment Considerations

**Environment Variables Required**
- `DATABASE_URL` - PostgreSQL connection string (Neon)
- `SESSION_SECRET` - Express session encryption key
- `ISSUER_URL` - OpenID Connect issuer (defaults to replit.com/oidc)
- `REPL_ID` - Replit application identifier
- `NODE_ENV` - Environment flag (development/production)

**Password Reset**
- Password reset functionality implemented without external email service
- In development mode, reset links are displayed in UI after requesting reset
- Reset tokens expire after 1 hour and can only be used once
- Note: For production, connect an email service (Resend, SendGrid) for sending reset emails

**Multi-Language Support**
- Application UI supports French (primary) and English
- Language toggle functionality in Navbar component
- Content prepared for Canadian and European markets

**Print Integration Strategy**
- QR code generation for embedding video links in physical books
- Print customization options: cover type (soft/hard), finish (matte/glossy), paper quality
- Print-on-demand model to minimize waste
- Design supports multiple copies for separated families or gifts