# VMG Pricing Calculator

A professional, interactive pricing calculator for Vogel Marketing Group's service packages. Built with React, TypeScript, and Vite, featuring VMG's signature maroon branding and PDF export capabilities.

![VMG Logo](public/vmg-logo-circle.jpg)

## 🎯 Overview

The VMG Pricing Calculator is a sophisticated tool designed to help sales teams and clients quickly configure and price marketing service packages. It provides real-time calculations, profit margin analysis, and professional PDF quote generation.

## ✨ Features

### Core Functionality
- **Dynamic Service Selection**: Choose from three service categories (Traffic Driver, Retention & CRM, Creative Support), each with three tier levels
- **Add-on Services**: Landing pages, sales funnels, analytics dashboards, strategy workshops, and video packs
- **Contract Terms**: 6-month or 12-month contracts (12-month includes 5% discount)
- **Real-time Calculations**: Instant updates for monthly, setup, annual costs, and profit margins
- **Client Personalization**: Optional client name field for personalized quotes

### Professional Design
- **VMG Branding**: Maroon/burgundy color palette (#7A1E1E) matching VMG's brand identity
- **Premium UI**: Gradient backgrounds, smooth animations, and modern typography
- **Responsive Layout**: Works seamlessly on desktop and tablet devices
- **Interactive Elements**: Hover effects, tooltips, and visual feedback

### PDF Export (Local Development)
- **Professional Quotes**: Generate branded PDF documents with Puppeteer
- **Complete Details**: Includes all selected services, pricing, and client information
- **VMG Footer**: Professional footer with Miami Beach address and contact email
- **Automatic Download**: PDFs download with descriptive filenames

### Usage Tracking
- **Last Used Log**: Displays when the calculator was last accessed
- **Local Storage**: Tracks usage history in the browser

## 🚀 How It Works

### 1. Select Services
Choose from three main service categories:

**Traffic Driver** - Paid advertising management
- Tier 1: Google + Meta up to $5K ad spend ($7,500/mo)
- Tier 2: Google + Meta + LinkedIn up to $15K ($12,500/mo)
- Tier 3: All channels including TikTok up to $50K ($19,000/mo)

**Retention & CRM** - Email marketing and automation
- Tier 1: 3 basic email flows ($3,500/mo)
- Tier 2: Full lifecycle automation with A/B testing ($6,000/mo)
- Tier 3: Multi-channel CRM with AI segmentation ($9,250/mo)

**Creative Support** - Content creation
- Tier 1: 8-10 creatives/month, 5-day turnaround ($2,500/mo)
- Tier 2: 15-20 creatives/month, 3-day turnaround ($5,000/mo)
- Tier 3: Unlimited creatives, 48-hour turnaround ($8,250/mo)

### 2. Add Optional Services
Enhance your package with:
- **Landing Pages**: $2,500 each (monthly recurring)
- **Sales Funnels**: $6,250 each (monthly recurring)
- **Analytics Dashboard**: $2,000 setup + $500/month
- **Strategy Workshop**: Half-day ($3,500) or Full-day ($6,000)
- **Video Pack**: $4,000 each (monthly recurring)

### 3. Choose Contract Term
- **6 Months**: Standard pricing
- **12 Months**: 5% discount on monthly fees

### 4. Review Quote Summary
The calculator displays:
- Monthly investment
- One-time setup fees
- Annual total value
- Profit margin percentage

### 5. Export PDF (Local Only)
Generate a professional PDF quote with VMG branding, client name, and complete pricing breakdown.

## 🛠️ Technology Stack

- **Frontend**: React 19.2 + TypeScript
- **Build Tool**: Vite 7.2
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **PDF Generation**: Puppeteer (Node.js server)
- **Deployment**: GitHub Pages (static frontend)

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/juliusalba/vmg-pricing-calculator.git
   cd vmg-pricing-calculator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5173`

4. **Start the PDF server** (optional, for PDF export)
   ```bash
   node pdf-server.js
   ```
   The PDF server runs on `http://localhost:3001`

### Production Build

```bash
npm run build
npm run preview
```

## 🌐 GitHub Pages Deployment

The application is automatically deployed to GitHub Pages via GitHub Actions when changes are pushed to the `main` branch.

**Live URL**: https://juliusalba.github.io/vmg-pricing-calculator/

> **Note**: PDF export is disabled on the GitHub Pages version as it requires a Node.js backend server.

## 📁 Project Structure

```
vmg-pricing-calculator/
├── public/
│   ├── vmg-logo-circle.jpg    # VMG circular logo
│   └── vmg-logo-text.jpg       # VMG text logo
├── src/
│   ├── components/
│   │   ├── Header.tsx          # Logo and client name input
│   │   ├── ServiceCard.tsx     # Service tier selection
│   │   ├── AddonsSection.tsx   # Add-on services
│   │   ├── ContractTerms.tsx   # Contract duration selector
│   │   ├── QuoteSummary.tsx    # Pricing summary and PDF export
│   │   ├── DetailsModal.tsx    # Detailed breakdown modal
│   │   └── UsageLog.tsx        # Last used timestamp
│   ├── data/
│   │   └── pricingData.ts      # Service pricing configuration
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   ├── App.tsx                 # Main application component
│   ├── index.css               # Global styles and VMG theme
│   └── main.tsx                # Application entry point
├── pdf-server.js               # Puppeteer PDF generation server
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS configuration
└── package.json                # Dependencies and scripts

```

## 🎨 Customization

### Updating Pricing
Edit `src/data/pricingData.ts` to modify service tiers and add-on prices.

### Changing Branding
- **Colors**: Update VMG maroon colors in `src/index.css` (CSS variables)
- **Logo**: Replace files in `public/` directory
- **Contact Info**: Update footer in `pdf-server.js`

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `node pdf-server.js` - Start PDF generation server

## 🤝 Contributing

This is a private project for Vogel Marketing Group. For internal contributions, please follow the standard Git workflow:

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

Proprietary - © 2025 Vogel Marketing Group

## 📧 Contact

**Vogel Marketing Group**
- Address: 705 Washington Avenue Suite 300, Miami Beach, Florida 33139
- Email: yourfriends@vmg7.com
- Website: https://vogelmarketinggroup.com

---

Built with ❤️ by the VMG team
