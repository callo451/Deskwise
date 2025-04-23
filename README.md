# Deskwise ITSM Platform

Deskwise is a multi-tenant ITIL-compliant ITSM (IT Service Management) platform that facilitates natural language ticket creation and automated ticket queue management.

## Features

- **Multi-tenant Architecture**: Secure data isolation between different organizations
- **Comprehensive Ticket Management**: Create, update, assign, and resolve tickets
- **Service Catalog**: Customizable service offerings for end users
- **Knowledge Base**: Self-service portal for finding solutions
- **SLA Management**: Define and track service level agreements
- **Role-based Access Control**: Different permission levels for users, technicians, managers, and administrators

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth with email/password and SSO options
- **Data Security**: Row-Level Security (RLS) for tenant isolation

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd deskwise-itsm
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with your Supabase credentials
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Start the development server
```bash
npm run dev
```

## Multi-tenancy Approach

Deskwise implements multi-tenancy through:

1. **Database Schema**: Each tenant-specific table includes a `tenant_id` column that references the `tenants` table
2. **Row-Level Security (RLS)**: Supabase policies restrict data access based on the user's tenant context
3. **JWT Claims**: Tenant information is stored in JWT claims for authenticated users
4. **UI Isolation**: The application UI only displays data relevant to the user's tenant

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── auth/         # Authentication components
│   ├── layout/       # Layout components
│   └── ui/           # UI components
├── contexts/         # React contexts
├── lib/              # Utility functions and libraries
├── pages/            # Page components
├── types/            # TypeScript type definitions
└── App.tsx           # Main application component
```

## License

[MIT](LICENSE)
