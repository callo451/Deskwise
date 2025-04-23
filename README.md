# Deskwise ITSM Platform

Deskwise is a modern, comprehensive IT Service Management (ITSM) platform built with ITIL best practices. It provides a complete solution for managing IT services, incidents, problems, changes, and improvements with a beautiful, user-friendly interface.

## 🌟 Features

- **Modern UI/UX**: Sleek glassmorphic design with intuitive navigation
- **Incident Management**: Streamlined ticket creation, tracking, and resolution
- **Problem Management**: Identify, track and resolve underlying issues
- **Change Management**: Structured process for implementing changes with approvals
- **Improvement Management**: Track and implement service improvements
- **Self-Service Portal**: User-friendly interface for service requests
- **Knowledge Base**: Centralized repository for solutions and documentation
- **Service Catalog**: Customizable service offerings with SLAs
- **Reporting & Analytics**: Comprehensive dashboards and metrics
- **Multi-tenant Architecture**: Secure data isolation between organizations

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Context API
- **Routing**: React Router
- **Forms**: React Hook Form
- **UI Components**: Custom components with Tailwind
- **Charts**: Chart.js with React-Chartjs-2

## 🛠️ Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone https://github.com/callo451/Deskwise.git
cd Deskwise
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with your Supabase credentials
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Build for production
```bash
npm run build
# or
yarn build
```

## 📋 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── auth/         # Authentication components
│   ├── changes/      # Change management components
│   ├── improvements/ # Improvement management components
│   ├── knowledge/    # Knowledge base components
│   ├── layout/       # Layout components
│   ├── portal/       # Self-service portal components
│   ├── problems/     # Problem management components
│   ├── reports/      # Reporting components
│   ├── settings/     # Settings components
│   ├── tickets/      # Ticket management components
│   └── ui/           # UI components
├── contexts/         # React contexts
├── lib/              # Utility functions and libraries
├── pages/            # Page components
├── services/         # API service functions
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## 🔒 Security

Deskwise implements security best practices:

- **Data Isolation**: Tenant-specific data is isolated using Supabase Row-Level Security (RLS)
- **Authentication**: Secure authentication through Supabase Auth
- **Authorization**: Role-based access control for different user types
- **API Security**: All API calls are authenticated and authorized

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Glassmorphic UI**: Modern, sleek interface with glassmorphism effects
- **Accessibility**: Designed with accessibility in mind
- **Dark/Light Mode**: Support for different visual preferences

## 🔄 Workflow Management

- **Ticket Lifecycle**: Comprehensive ticket status management
- **Approval Workflows**: Structured approval processes for changes
- **SLA Tracking**: Monitor and enforce Service Level Agreements
- **Automation**: Automated ticket routing and notifications

## 📊 Reporting

- **Dashboards**: Visual representation of key metrics
- **Custom Reports**: Generate reports based on various parameters
- **Export Options**: Export data in various formats
- **Trend Analysis**: Track performance over time

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

Built with ❤️ using React, TypeScript, and Supabase.
