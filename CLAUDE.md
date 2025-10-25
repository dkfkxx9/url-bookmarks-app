# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Simple Korean todo list application built with Vite, React, TypeScript, and shadcn/ui. This is a Lovable-generated project with all UI text in Korean.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build for development (preserves development mode features)
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm preview
```

## Architecture

### App Entry and Routing

- Entry point: `src/main.tsx` - renders the App component
- App setup: `src/App.tsx` - configures React Query, routing, and toast providers
- Routes are defined in `App.tsx` using react-router-dom
- All custom routes must be added ABOVE the catch-all `*` route (NotFound page)

### State Management

- Uses React Query (`@tanstack/react-query`) for server state (configured in `App.tsx`)
- Local component state with React hooks (useState)
- No Redux or other global state management

### Component Architecture

#### Pages
- `src/pages/Index.tsx` - Main todo list page with all todo logic
- `src/pages/NotFound.tsx` - 404 page

#### UI Components
- Located in `src/components/ui/` - shadcn/ui components (Radix UI primitives)
- Pre-built components: Button, Input, Checkbox, Card, Toast, etc.
- DO NOT modify these components directly - they are shadcn/ui primitives

#### Custom Components
- No custom components currently - all logic is in the Index page

### Styling System

#### Design Tokens
- All design tokens defined in `src/index.css` using CSS custom properties
- Colors MUST be HSL format
- Light and dark mode variables defined in `:root` and `.dark`
- Custom tokens for this app:
  - `--gradient-primary`: Purple gradient (250° to 270° hue)
  - `--gradient-subtle`: Background gradient
  - `--shadow-card`: Card shadow with purple tint
  - `--shadow-hover`: Enhanced hover shadow

#### Tailwind Configuration
- Path alias: `@/` maps to `src/`
- Extended animations: `fade-in`, `slide-in`, `accordion-down`, `accordion-up`
- Custom background images: `bg-gradient-primary`, `bg-gradient-subtle`
- Custom shadows: `shadow-card`, `shadow-hover`

#### Styling Utilities
- `src/lib/utils.ts` exports `cn()` function for className merging (clsx + tailwind-merge)
- Use `cn()` to conditionally merge Tailwind classes

### TypeScript Configuration

- Path aliases configured in both `vite.config.ts` and `tsconfig.json`
- `@/` resolves to `./src/`
- Relaxed TypeScript settings:
  - `noImplicitAny: false`
  - `strictNullChecks: false`
  - `noUnusedParameters: false`
  - `noUnusedLocals: false`

### Build Configuration

- Vite dev server runs on port 8080 with IPv6 support (`::``)
- SWC used for fast React compilation (`@vitejs/plugin-react-swc`)
- `lovable-tagger` plugin enabled in development mode only

## Key Patterns

### Toast Notifications
- Uses `sonner` library via `src/components/ui/sonner.tsx`
- Import: `import { toast } from "sonner"`
- Usage: `toast.success("message")`, `toast.error("message")`

### Component Styling Pattern
- Inline style for animation delays: `style={{ animationDelay: "0.1s" }}`
- Gradient buttons: `className="bg-gradient-primary"`
- Card containers: `className="bg-card rounded-2xl shadow-card"`
- Hover effects: `hover:shadow-hover`

### Data Types
- Todo items use `crypto.randomUUID()` for IDs
- Dates stored as Date objects (e.g., `createdAt: new Date()`)

## Lovable Integration

- This project is managed by Lovable (https://lovable.dev)
- Changes pushed to git are reflected in Lovable
- Changes made via Lovable are auto-committed to this repo
- Project URL in README.md
