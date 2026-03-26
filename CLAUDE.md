# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in chat, and the AI generates them in real-time using a virtual file system. Components are previewed instantly without writing files to disk.

## Tech Stack

- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS v4** for styling
- **Prisma** with SQLite for database
- **Anthropic Claude AI** via Vercel AI SDK
- **Babel Standalone** for JSX transformation
- **Vitest** for testing

## Development Commands

```bash
# Initial setup (install deps, generate Prisma client, run migrations)
npm run setup

# Start development server with Turbopack
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Reset database (destructive)
npm run db:reset
```

## Architecture

### Virtual File System

The core of UIGen is the `VirtualFileSystem` class (`src/lib/file-system.ts`), which maintains an in-memory file tree. Files are never written to disk during component generation. The VFS provides:

- File/directory CRUD operations with automatic parent directory creation
- Serialization/deserialization for database persistence
- Text editor operations (view, create, str_replace, insert)
- Path normalization and @/ alias support

### AI Component Generation

The chat API endpoint (`src/app/api/chat/route.ts`) orchestrates component generation:

1. Receives messages and file state from client
2. Reconstructs VirtualFileSystem from serialized data
3. Streams responses from Claude (or mock provider if no API key)
4. Provides two tools to the AI:
   - `str_replace_editor`: View/create/edit files with string replacement
   - `file_manager`: Rename/delete files and folders
5. Persists conversation and file state to database on completion

**System Prompt**: Located in `src/lib/prompts/generation.tsx`. Key constraints:
- All projects must have `/App.jsx` as entry point with default export
- Use Tailwind CSS for styling, not inline styles
- Import local files with `@/` alias (e.g., `@/components/Calculator`)
- Virtual FS operates on root `/` - no traditional directory structure

**Mock Provider**: If `ANTHROPIC_API_KEY` is not set, uses `MockLanguageModel` (`src/lib/provider.ts`) that generates static Counter/Form/Card components.

### JSX Transformation & Preview

The `jsx-transformer.ts` module transforms JSX/TSX to executable JavaScript:

1. **Transform**: Uses Babel Standalone to transpile JSX/TSX to JS
2. **Import Map Generation**: Creates ES module import map with:
   - React/ReactDOM from esm.sh CDN
   - Local files as blob URLs
   - @/ alias resolution to root directory
   - Third-party packages from esm.sh
3. **Preview HTML**: Generates standalone HTML with:
   - Tailwind CSS CDN
   - Import map for module resolution
   - Error boundary for runtime errors
   - Syntax error display if transformation fails

Entry point is always `/App.jsx`, which must export a React component as default.

### Database Schema

Two main models in `prisma/schema.prisma`:

- **User**: Authentication (email/password, bcrypt hashed)
- **Project**: Stores name, messages JSON, and file data JSON. Linked to User (nullable for anonymous projects)

Projects serialize both the chat history and VirtualFileSystem state for persistence.

### Authentication

JWT-based session management (`src/lib/auth.ts`):
- Sessions stored in HTTP-only cookies
- Middleware protects `/api/projects` and `/api/filesystem` routes
- Anonymous users can create temporary projects (not persisted)

## File Organization

```
src/
├── app/                    # Next.js App Router
│   ├── api/chat/          # AI streaming endpoint
│   ├── [projectId]/       # Project-specific pages
│   └── page.tsx           # Home page
├── components/
│   ├── auth/              # Login/signup forms
│   ├── chat/              # Chat interface components
│   ├── editor/            # Monaco code editor integration
│   ├── preview/           # Live preview frame
│   └── ui/                # Reusable UI components (Radix UI)
├── lib/
│   ├── file-system.ts     # Virtual file system implementation
│   ├── provider.ts        # Language model provider (Claude/Mock)
│   ├── auth.ts            # Session management
│   ├── prisma.ts          # Prisma client singleton
│   ├── tools/             # AI tool implementations
│   ├── transform/         # JSX transformer & import map
│   └── prompts/           # System prompts
├── actions/               # Server actions for projects
└── middleware.ts          # Auth middleware
```

## Testing

Tests use Vitest with React Testing Library:
- `src/lib/__tests__/file-system.test.ts` - VFS operations
- `src/lib/transform/__tests__/jsx-transformer.test.ts` - JSX transformation
- Component tests in `__tests__` directories

Run single test file:
```bash
npm test -- src/lib/__tests__/file-system.test.ts
```

## Key Concepts for Development

1. **Virtual FS First**: All file operations go through VirtualFileSystem, never Node.js fs module
2. **Serialization**: VFS and messages must be serializable to JSON for database storage
3. **Import Map Resolution**: Preview relies on import map - ensure all local files use @/ alias
4. **Tool Constraints**: AI tools mirror text editor commands (view, create, str_replace, insert)
5. **Entry Point Convention**: Every project needs /App.jsx with default export for preview to work
6. **Mock Mode**: Application fully functional without API key using static mock responses

## Environment Variables

- `ANTHROPIC_API_KEY` (optional): Enables Claude API. Without it, uses mock provider with static components
