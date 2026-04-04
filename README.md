# T-Dash - Project & Time Tracking Dashboard

A project management dashboard built on top of shadcn-admin with time tracking and records management features.

![t-dash](public/images/t-dash.png)

## Overview

T-Dash extends the shadcn-admin dashboard template with:

- **Time Records Management** - Track time spent on projects with detailed records
- **Calendar View** - Visualize time entries by month with totals
- **Data Table** - Filter, sort, and manage records with advanced filtering
- **Supabase Integration** - Backend-as-a-Service for data persistence

## Features

### Core Features

- **Records Management** - CRUD operations for time tracking records
- **Calendar View** - Monthly calendar showing time spent per day
- **Project Filtering** - Filter records by project with record counts
- **Month Filtering** - Filter records by month
- **Data Table** - Sortable, filterable table with pagination
- **Refresh Button** - Reload data on demand

### Technical Features

- **TanStack Table** - Advanced data table with faceted filtering
- **React Day Picker** - Customized calendar component
- **Supabase Client** - Context provider for Supabase integration
- **TypeScript** - Full type safety throughout the codebase
- **Zod Validation** - Form validation with Zod schemas

## Tech Stack

**Frontend:**

- [React](https://react.dev/) with TypeScript
- [Vite](https://vitejs.dev/) - Build tool
- [TanStack Router](https://tanstack.com/router/latest) - Routing
- [TanStack Table](https://tanstack.com/table/latest) - Data tables
- [React Day Picker](https://daypicker.dev/) - Calendar component
- [Shadcn UI](https://ui.shadcn.com/) - UI components
- [TailwindCSS](https://tailwindcss.com/) - Styling
- [date-fns](https://date-fns.org/) - Date utilities
- [Zod](https://zod.dev/) - Schema validation

**Backend:**

- [Supabase](https://supabase.com/) - Database & Authentication

## Database Schema

### Tables

**domains** - Project domains/categories

- `id` (serial) - Primary key
- `title` (text) - Domain name
- `description` (text) - Domain description
- `created_at` (timestamptz) - Creation timestamp

**projects** - Projects within domains

- `id` (serial) - Primary key
- `domain_id` (integer) - Foreign key to domains
- `title` (text) - Project name
- `description` (text) - Project description
- `status` (text) - Project status
- `created_at` (timestamptz) - Creation timestamp

**tasks** - Tasks within projects

- `id` (serial) - Primary key
- `project_id` (integer) - Foreign key to projects
- `title` (text) - Task name
- `description` (text) - Task description
- `status` (text) - Task status
- `priority` (text) - Task priority
- `created_at` (timestamptz) - Creation timestamp

**records** - Time tracking records

- `id` (serial) - Primary key
- `created_at` (timestamptz) - Creation timestamp
- `date` (text) - Record date (YYYY-MM-DD)
- `project_id` (integer) - Foreign key to projects
- `time_spent` (numeric) - Time spent in hours
- `title` (text) - Record title
- `description` (text) - Record description
- `category` (text) - Record category
- `tags` (text[]) - Array of tags
- `link` (text) - External link

See [SUPABASE-CONFIG.md](./SUPABASE-CONFIG.md) for detailed setup instructions.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/t-dash.git
cd t-dash

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
pnpm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
src/
├── components/
│   ├── data-table/         # Reusable data table components
│   └── ui/                # Shadcn UI components
├── context/
│   └── supabase-context.tsx  # Supabase client provider
├── features/
│   ├── t-records/         # Time records feature
│   │   ├── components/    # Records-specific components
│   │   ├── data/          # Zod schemas
│   │   └── index.tsx      # Records page
│   └── t-projects/        # Projects feature
├── hooks/
│   └── use-supabase.tsx   # Supabase hooks
├── lib/
│   ├── records.ts         # Records CRUD operations
│   ├── projects.ts        # Projects CRUD operations
│   └── tasks.ts           # Tasks CRUD operations
└── types/                 # TypeScript type definitions
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - Run TypeScript type checking

## License

MIT License - See [LICENSE](./LICENSE) for details.
