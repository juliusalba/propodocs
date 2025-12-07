# Propodocs

**Professional Proposal Management & Pricing Platform**

Propodocs is a comprehensive proposal management system that combines intelligent pricing calculators, AI-powered proposal generation, client engagement tools, and advanced analytics to streamline your sales process.

![Propodocs](https://img.shields.io/badge/version-1.0.0-red?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-black?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-red?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-black?style=for-the-badge&logo=typescript)

---

## 🎯 Overview

Propodocs transforms the way you create, manage, and track business proposals. Built for agencies, consultants, and service providers, it combines powerful pricing tools with intelligent automation to help you close deals faster.

### Key Capabilities

- 🧮 **Dynamic Pricing Calculators** - Build custom calculators with AI or use pre-built templates
- 🤖 **AI Proposal Generation** - Generate professional proposals in seconds using advanced AI
- 📊 **Real-time Analytics** - Track views, engagement, and client behavior
- 🔗 **Secure Link Sharing** - Share proposals with password protection and expiration dates
- 📝 **Contract & Invoice Management** - Complete deal lifecycle from proposal to payment
- 👥 **CRM Integration** - Manage clients and track all interactions in one place
- 📧 **Email Notifications** - Automated alerts for proposal views and status changes
- 💬 **Client Collaboration** - Built-in commenting and feedback system

---

## 🚀 Features

### Pricing Calculators

Create sophisticated pricing calculators with multiple layouts:

- **Tiered Pricing** - Define service tiers with features and pricing
- **Itemized Pricing** - Line-by-line service breakdowns
- **Hybrid Models** - Combine tiers with add-ons and custom items
- **AI Calculator Builder** - Generate calculators from text, documents, or voice input

### Proposal Management

Complete proposal lifecycle management:

- **Rich Text Editor** - Powered by BlockNote with tables, images, and formatting
- **Template Library** - Save and reuse successful proposals
- **Version Control** - Track changes and restore previous versions
- **Digital Signatures** - Built-in signature capture for contracts
- **PDF Export** - Generate professional PDFs for offline sharing

### Analytics & Insights

Understand how clients interact with your proposals:

- **View Tracking** - See when and how often proposals are viewed
- **Session Analytics** - Track time spent on each section
- **Engagement Metrics** - Monitor client interest and behavior
- **Pipeline Visualization** - Track proposal status and conversion rates

### Client Experience

Professional, branded client portal:

- **Responsive Design** - Perfect on desktop, tablet, and mobile
- **Interactive Calculators** - Clients can customize pricing in real-time
- **Accept/Reject Actions** - Simple decision-making workflow
- **Comment System** - Two-way communication on proposals

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **BlockNote** - Rich text editor
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Supabase** - Database and authentication
- **PostgreSQL** - Relational database
- **JWT** - Secure authentication

### AI & Integrations
- **OpenAI GPT-4** - Proposal and calculator generation
- **Unsplash API** - High-quality cover images
- **SendGrid** - Email delivery (optional)
- **Stripe** - Payment processing (optional)

---

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)
- OpenAI API key (for AI features)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/juliusalba/propodocs.git
   cd propodocs
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Configure environment variables**
   
   Create `server/.env` from the example:
   ```bash
   cp server/.env.example server/.env
   ```
   
   Required variables:
   ```env
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # JWT
   JWT_SECRET=your_secure_random_string
   
   # Optional: Email
   SENDGRID_API_KEY=your_sendgrid_key
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   
   # Optional: Unsplash
   UNSPLASH_ACCESS_KEY=your_unsplash_key
   ```

4. **Set up the database**
   
   Run the Supabase migrations:
   ```bash
   cd server
   npm run migrate
   ```

5. **Start the application**
   ```bash
   npm run dev:all
   ```
   
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

---

## 🎨 Design System

Propodocs uses a carefully crafted design system with a professional color palette:

- **Primary Red** (`#8C0000`) - Actions, CTAs, highlights
- **Black** (`#050505`) - Text, borders, backgrounds
- **Cream** (`#FAF3CD`) - Subtle backgrounds, hover states
- **Sunglow** (`#FFC917`) - Secondary highlights
- **Harvest Gold** (`#CD8417`) - Accents, borders

---

## 📖 Usage Guide

### Creating Your First Proposal

1. **Navigate to Dashboard** - Log in and access your dashboard
2. **Create Calculator** - Build a pricing calculator or use a template
3. **Generate Proposal** - Use AI to create a proposal from your calculator
4. **Customize Content** - Edit using the rich text editor
5. **Share with Client** - Generate a secure link and send to your client
6. **Track Engagement** - Monitor views and interactions in real-time

### Building Custom Calculators

Propodocs offers multiple ways to create calculators:

**AI Generation:**
- Describe your services in plain text
- Upload a PDF of your pricing sheet
- Record a voice description
- Take a screenshot of existing pricing

**Manual Builder:**
- Define tiers with features and pricing
- Add custom add-ons and services
- Configure formulas for dynamic pricing
- Preview in real-time

### Managing Clients

The built-in CRM helps you stay organized:

- Store client contact information
- Track all proposals per client
- View engagement history
- Manage contracts and invoices

---

## 🔐 Security

Propodocs takes security seriously:

- **Authentication** - Secure JWT-based auth with Supabase
- **Password Protection** - Optional password-protected proposal links
- **Link Expiration** - Set automatic expiration on shared links
- **Row-Level Security** - Database-level access control
- **HTTPS Only** - All production traffic encrypted
- **Environment Variables** - Sensitive data never committed to code

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - Automatic deployments on push to main

### Manual Deployment

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Deploy the backend** to your preferred hosting (Railway, Render, etc.)

3. **Update environment variables** for production

---

## 📁 Project Structure

```
propodocs/
├── src/                          # Frontend React application
│   ├── components/              # Reusable UI components
│   │   ├── calculators/        # Calculator components
│   │   ├── dashboard/          # Dashboard layout
│   │   ├── editor/             # Proposal editor
│   │   └── CRM/                # Client management
│   ├── pages/                   # Route pages
│   ├── contexts/                # React contexts
│   ├── lib/                     # Utilities and API client
│   └── types/                   # TypeScript definitions
├── server/                       # Backend Express application
│   ├── src/
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Auth and validation
│   │   ├── utils/              # Helper functions
│   │   └── db/                 # Database schema
│   └── migrations/             # Database migrations
└── public/                       # Static assets
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Supabase](https://supabase.com/)
- AI by [OpenAI](https://openai.com/)
- Icons from [Lucide](https://lucide.dev/)
- Editor by [BlockNote](https://www.blocknotejs.org/)

---

## 📧 Support

For support, email support@propodocs.com or open an issue on GitHub.

---

## 🗺️ Roadmap

- [ ] Mobile app (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Zapier integration
- [ ] Multi-language support
- [ ] White-label options
- [ ] Team collaboration features
- [ ] Advanced reporting and exports

---

**Made with ❤️ by the Propodocs Team**
