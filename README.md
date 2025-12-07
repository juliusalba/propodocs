# VMG Proposal Management System

A comprehensive proposal management system built on top of the VMG Pricing Calculator, featuring AI-powered proposal generation, link sharing, analytics, and client engagement tools.

## Features

- **Pricing Calculators**: Interactive calculators for VMG Marketing and Marine & Powersports services.
- **AI Proposal Generation**: Auto-generate professional proposals using OpenAI based on calculator inputs.
- **Proposal Management**: Dashboard to track, view, and manage all proposals.
- **Link Sharing**: Share secure links with clients, set expiration dates, and password protection.
- **Analytics**: Track proposal views, time spent, and engagement metrics (heatmaps coming soon).
- **Client Engagement**: Accept/Reject functionality and comments system.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Express.js, SQLite, JWT Auth
- **AI**: OpenAI GPT-4o
- **Email**: SendGrid (optional)

## Getting Started

### Prerequisites

- Node.js (v18+)
- OpenAI API Key (for AI features)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. Configure environment variables:
   - Copy `server/.env.example` to `server/.env`
   - Add your OpenAI API Key and other secrets

### Running the Application

Run both frontend and backend concurrently:

```bash
npm run dev:all
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Development

- **Frontend**: `src/` - React application
- **Backend**: `server/src/` - Express server
- **Database**: `server/data/proposals.db` - SQLite database

## License

Private - Vogel Marketing Group
