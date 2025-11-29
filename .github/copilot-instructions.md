# Education & Learning Agents Hub - AI Agent Instructions

## Project Overview

Next.js 16 (App Router) frontend for a multi-agent system with JWT authentication, real-time agent health monitoring, and per-user conversation history. Built with TypeScript, React 19, Tailwind CSS 4, and shadcn/ui components.

## Architecture & Data Flow

### Context Provider Hierarchy (see `app/providers.tsx`)

Providers wrap in strict order: `UserProvider` → `AgentProvider` → `HistoryProvider` → `SettingsProvider`

- **UserProvider** (`context/user-context.tsx`): Manages JWT auth, stores token in localStorage as `jwt`, validates on mount via `/api/auth/me`
- **AgentProvider** (`context/agent-context.tsx`): Fetches agent registry on user auth, polls health every 30s, depends on `useUser()`
- **HistoryProvider** (`context/history-context.tsx`): Per-user localStorage keys (`agent-history-${userId}`), scoped to authenticated user
- **SettingsProvider** (`context/settings-context.tsx`): Per-user settings (`agent-settings-${userId}`) for LTM/STM/auto-routing

### Authentication Flow

1. All API requests require JWT via `Authorization: Bearer ${token}` header (see `lib/api-service.ts`)
2. `AuthGuard` component (`components/auth-guard.tsx`) wraps all pages in `app/layout.tsx`, redirects to `/login` if unauthenticated
3. Root page (`app/page.tsx`) redirects authenticated users to `/dashboard`, unauthenticated to `/login`
4. Logout clears `jwt` from localStorage and resets all context state

### API Integration (`lib/api-service.ts`)

Base URL: `process.env.NEXT_PUBLIC_API_URL` (default: `http://127.0.0.1:8000`)

Key endpoints:

- `POST /api/auth/login` → Returns `{token, user}`, no auth required
- `GET /api/auth/me` → Validates token, returns current user
- `GET /api/supervisor/registry` → Returns `{agents: Agent[]}`
- `POST /api/supervisor/request` → Payload: `{agentId, request, priority, modelOverride?, autoRoute}`
- `GET /api/agent/{id}/health` → Returns `{status: "healthy" | "degraded" | "offline"}`

## Critical Conventions

### Component Patterns

- **Client components**: All interactive components use `"use client"` directive (contexts, forms, modals)
- **Server components**: Only `app/layout.tsx` and static metadata components are server-side
- **UI components**: Located in `components/ui/`, generated from shadcn/ui (New York style), never edit directly—regenerate via shadcn CLI

### State Management

- Use React Context exclusively, no Redux/Zustand
- Never access localStorage directly—always through context providers
- History and settings MUST be scoped per user ID to prevent data leakage

### Type Safety (`types/index.ts`)

- `Agent`: Core entity with `{id, name, description?, capabilities, status?}`
- `RequestPayload`: Always include `priority` (default 5), `autoRoute` (from settings), `modelOverride` (nullable)
- `Message`: Type union `'user' | 'agent' | 'error'`, timestamp must be ISO 8601 string

### Path Aliases (tsconfig.json)

- `@/` maps to project root
- Always use `@/components`, `@/context`, `@/lib`, `@/types` for imports

## Development Workflows

### Running the App

```powershell
# Development (port 3000)
npm run dev

# Production build
npm run build; npm start
```

### Testing

```powershell
npm test  # Jest + Testing Library (see __tests__/)
```

Test conventions:

- Mock contexts when testing components that use `useAgents()`, `useHistory()`, etc.
- Place tests in `__tests__/` mirroring source structure (`__tests__/components/agent-card.test.tsx`)

### Adding shadcn/ui Components

```powershell
npx shadcn@latest add <component-name>
```

Configuration in `components.json`: New York style, `@/` aliases, Lucide icons

### Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Common Pitfalls

1. **Context dependency order**: `AgentProvider` MUST have access to `useUser()`. Never reorder providers in `app/providers.tsx`.

2. **localStorage race conditions**: History/settings contexts load on user change (`useEffect` with `user` dependency). Always check `user` exists before localStorage operations.

3. **Health polling**: `AgentProvider` starts polling only after agents load AND user is authenticated. Don't poll if `agents.length === 0` or `!user`.

4. **Auth headers**: `getAuthHeaders()` checks `typeof window !== "undefined"` for SSR compatibility. Server components can't access localStorage.

5. **TypeScript errors ignored**: `next.config.mjs` sets `ignoreBuildErrors: true`. Fix TS errors—don't rely on this escape hatch.

## Key Files Reference

- **Routing**: `app/dashboard/page.tsx` (main UI), `app/agents/page.tsx` (agent list), `app/conversation/[id]/page.tsx` (agent chat)
- **Request flow**: `components/request-composer.tsx` → `lib/api-service.ts` → backend → `context/history-context.tsx`
- **Health monitoring**: `context/agent-context.tsx` (polling logic) → `components/health-status.tsx` (visual indicator)
- **Styling**: `app/globals.css` (Tailwind + CSS variables), Tailwind 4 with `@tailwindcss/postcss`

## Specialized Agent Interfaces

### Exam Readiness Agent (`exam-readiness-agent`)

The exam readiness agent has a specialized interface for generating assessments (quizzes, exams, assignments) with structured question types.

**Conditional Rendering** (`components/request-composer.tsx`):

- When `agentId === "exam-readiness-agent"`, renders `ExamReadinessForm` instead of standard text input
- Form located at `components/agents/exam-readiness-form.tsx`

**Form Features**:

- **Dynamic Question Counts**: Users select counts per question type (MCQ, Short Answer, Essay, Coding, Math)
- **Auto-calculated Total**: `question_count` = sum of all type counts (critical for API validation)
- **Assessment Config**: Subject, difficulty (easy/medium/hard), type (quiz/exam/assignment)
- **Advanced Options** (collapsible):
  - RAG: PDF input paths (comma-separated filenames from server's `rag_documents/`), top-k chunks, max chars
  - PDF Export: Optional filename for generated PDF

**Request Payload Structure**:

```typescript
{
  agentId: "exam-readiness-agent",
  request: "Generate a [difficulty] [type] for [subject]",
  subject: string,
  assessment_type: "quiz" | "exam" | "assignment",
  difficulty: "easy" | "medium" | "hard",
  question_count: number, // Must equal sum of type_counts
  type_counts: { mcq?: number, short_text?: number, essay?: number, coding?: number, math?: number },
  // Optional RAG
  use_rag?: boolean,
  pdf_input_paths?: string[],
  rag_top_k?: number,
  rag_max_chars?: number,
  // Optional PDF Export
  export_pdf?: boolean,
  pdf_output_filename?: string
}
```

**Response Rendering** (`components/chat-message.tsx`):

- Detects JSON responses with `{title, questions[]}` structure
- Renders `AssessmentPreview` component (`components/agents/assessment-preview.tsx`) showing:
  - Assessment metadata (title, difficulty, question distribution)
  - Formatted questions with options, correct answers, explanations
  - Download PDF button if `metadata.pdf_exported === true`
- Falls back to plain text if JSON parsing fails or structure doesn't match

**Type Definitions** (`types/index.ts`):

- Extended `RequestPayload` with optional exam-specific fields
- New interfaces: `AssessmentResponse`, `Question`, `AssessmentMetadata`
- `RequestResponse.response` now supports `string | AssessmentResponse`

**Critical Constraint**: The sum of `type_counts` values MUST equal `question_count`, or the backend will reject the request. The form enforces this by auto-calculating the total.

## When Adding Features

1. **New context**: Add to `app/providers.tsx` in correct dependency order, scope localStorage keys by user ID
2. **New API endpoint**: Add typed function to `lib/api-service.ts`, include `getAuthHeaders()`, handle errors gracefully
3. **New page**: Create in `app/` directory, ensure `AuthGuard` wraps via layout, redirect logic if needed
4. **New component**: Use `"use client"` if stateful/interactive, import UI components from `@/components/ui/`

## Testing Checklist

- [ ] Test logged-out state (should redirect to `/login`)
- [ ] Test user switching (localStorage keys should change)
- [ ] Test offline agent health (should show "offline" badge)
- [ ] Test auto-route toggle (payload should set `agentId: "supervisor"`)
- [ ] Test history persistence (reload page, history should remain)
