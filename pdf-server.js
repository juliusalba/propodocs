import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Test endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PDF Server is running' });
});

app.post('/generate-pdf', async (req, res) => {
  console.log('PDF generation request received');
  let browser;
  try {
    const { clientName, selectedServices, addOns, contractTerm, totals } = req.body;
    console.log('Request data:', { clientName, selectedServices, contractTerm });

    // Generate HTML content for PDF
    const htmlContent = generatePDFHTML(clientName, selectedServices, addOns, contractTerm, totals);

    // Launch Puppeteer
    console.log('Launching Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    console.log('Generating PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();
    console.log('PDF generated successfully');

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=VMG-Quote-${clientName || 'Client'}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to generate PDF', message: error.message });
  }
});

app.post('/generate-marine-pdf', async (req, res) => {
  console.log('Marine PDF generation request received');
  let browser;
  try {
    const { clientName, selectedTier, addOns, totals } = req.body;
    console.log('Request data:', { clientName, selectedTier });

    // Generate HTML content for Marine PDF
    const htmlContent = generateMarinePDFHTML(clientName, selectedTier, addOns, totals);

    // Launch Puppeteer
    console.log('Launching Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    console.log('Generating Marine PDF...');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();
    console.log('Marine PDF generated successfully');

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=VMG-Marine-Quote-${clientName || 'Client'}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating Marine PDF:', error);
    if (browser) await browser.close();
    res.status(500).json({ error: 'Failed to generate PDF', message: error.message });
  }
});

function generatePDFHTML(clientName, selectedServices, addOns, contractTerm, totals) {
  const services = {
    traffic: {
      name: "Traffic Driver", tiers: {
        1: { monthly: 7500, setup: 3750, description: "Google + Meta management up to $5K ad spend" },
        2: { monthly: 12500, setup: 6250, description: "Google + Meta + LinkedIn up to $15K ad spend" },
        3: { monthly: 19000, setup: 9500, description: "All channels including TikTok up to $50K ad spend" }
      }
    },
    retention: {
      name: "Retention & CRM", tiers: {
        1: { monthly: 3500, setup: 1750, description: "3 basic email flows with templates" },
        2: { monthly: 6000, setup: 3000, description: "Full lifecycle automation with A/B testing" },
        3: { monthly: 9250, setup: 4625, description: "Multi-channel CRM with AI segmentation" }
      }
    },
    creative: {
      name: "Creative Support", tiers: {
        1: { monthly: 2500, setup: 1250, description: "8-10 creatives per month, 5-day turnaround" },
        2: { monthly: 5000, setup: 2500, description: "15-20 creatives per month, 3-day turnaround" },
        3: { monthly: 8250, setup: 4125, description: "Unlimited creatives, 48-hour turnaround" }
      }
    }
  };

  const addOnPrices = {
    landingPages: 2500,
    funnels: 6250,
    dashboard: { setup: 2000, monthly: 500 },
    workshop: { halfDay: 3500, fullDay: 6000 },
    videoPack: 4000
  };

  let servicesHTML = '';
  Object.entries(selectedServices).forEach(([key, tier]) => {
    if (tier && services[key]) {
      const service = services[key];
      const tierData = service.tiers[tier];
      servicesHTML += `
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #3b82f6;">
          <div style="font-weight: 700; color: #1f2937; margin-bottom: 8px; font-size: 16px;">
            ${service.name} - Tier ${tier}
          </div>
          <div style="color: #6b7280; font-size: 14px; margin-bottom: 8px;">
            ${tierData.description}
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #6b7280;">Monthly:</span>
            <span style="font-weight: 600; color: #3b82f6;">$${tierData.monthly.toLocaleString()}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #6b7280;">Setup:</span>
            <span style="font-weight: 600; color: #6b7280;">$${tierData.setup.toLocaleString()}</span>
          </div>
        </div>
      `;
    }
  });

  let addOnsHTML = '';
  if (addOns.landingPages > 0) {
    addOnsHTML += `<li>${addOns.landingPages} Landing Page${addOns.landingPages > 1 ? 's' : ''} - $${(addOns.landingPages * addOnPrices.landingPages).toLocaleString()}</li>`;
  }
  if (addOns.funnels > 0) {
    addOnsHTML += `<li>${addOns.funnels} Sales Funnel${addOns.funnels > 1 ? 's' : ''} - $${(addOns.funnels * addOnPrices.funnels).toLocaleString()}</li>`;
  }
  if (addOns.dashboard) {
    addOnsHTML += `<li>Analytics Dashboard - $${addOnPrices.dashboard.setup.toLocaleString()} setup + $${addOnPrices.dashboard.monthly}/mo</li>`;
  }
  if (addOns.workshop) {
    const workshopPrice = addOns.workshop === 'halfDay' ? addOnPrices.workshop.halfDay : addOnPrices.workshop.fullDay;
    addOnsHTML += `<li>Strategy Workshop (${addOns.workshop === 'halfDay' ? 'Half-day' : 'Full-day'}) - $${workshopPrice.toLocaleString()}</li>`;
  }
  if (addOns.videoPack > 0) {
    addOnsHTML += `<li>${addOns.videoPack} Video Pack${addOns.videoPack > 1 ? 's' : ''} - $${(addOns.videoPack * addOnPrices.videoPack).toLocaleString()}</li>`;
  }

  const addOnsSection = addOnsHTML ? `
    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #10b981;">
      <div style="font-weight: 700; color: #1f2937; margin-bottom: 12px; font-size: 16px;">Add-on Services</div>
      <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px;">
        ${addOnsHTML}
      </ul>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          color: #1f2937;
          line-height: 1.6;
        }
        .header {
          background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%);
          color: white;
          padding: 40px 0;
          text-align: center;
          margin-bottom: 40px;
        }
        .logo {
          font-size: 32px;
          font-weight: 300;
          letter-spacing: 3px;
          margin-bottom: 8px;
        }
        .tagline {
          font-size: 14px;
          opacity: 0.9;
          font-weight: 300;
        }
        .client-name {
          background: rgba(255, 255, 255, 0.2);
          padding: 12px 24px;
          border-radius: 8px;
          margin-top: 20px;
          display: inline-block;
          font-size: 18px;
          font-weight: 400;
        }
        .content {
          padding: 0 40px;
        }
        .section {
          margin-bottom: 32px;
        }
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        .summary-box {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 2px solid #10b981;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #d1fae5;
        }
        .summary-row:last-child {
          border-bottom: none;
          padding-top: 16px;
          border-top: 2px solid #10b981;
        }
        .summary-label {
          font-weight: 600;
          color: #065f46;
        }
        .summary-value {
          font-weight: 700;
          font-size: 24px;
          color: #059669;
        }
        .footer {
          margin-top: 60px;
          padding: 32px 40px;
          background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%);
          color: white;
          text-align: center;
        }
        .footer-logo {
          font-size: 28px;
          font-weight: 300;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }
        .footer-tagline {
          font-size: 14px;
          opacity: 0.8;
          margin-bottom: 20px;
          font-weight: 300;
        }
        .footer-contact {
          font-size: 12px;
          opacity: 0.9;
          line-height: 1.8;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Vogel Marketing Group</div>
        <div class="tagline">Professional Marketing Solutions</div>
        ${clientName ? `<div class="client-name">Prepared for: ${clientName}</div>` : ''}
      </div>

      <div class="content">
        <div class="summary-box">
          <div class="summary-row">
            <span class="summary-label">Monthly Investment:</span>
            <span class="summary-value">$${Math.round(totals.monthlyTotal).toLocaleString()}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Setup Fee:</span>
            <span class="summary-value">$${totals.setupTotal.toLocaleString()}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Annual Value:</span>
            <span class="summary-value">$${Math.round(totals.annualTotal).toLocaleString()}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Selected Services</div>
          ${servicesHTML}
        </div>

        ${addOnsSection ? `
          <div class="section">
            <div class="section-title">Add-on Services</div>
            ${addOnsSection}
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">Contract Terms</div>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1;">
            <div style="font-weight: 600; color: #1f2937; font-size: 16px;">
              ${contractTerm === '12' ? '12 Month Contract (5% Discount Applied)' : '6 Month Contract (Standard Terms)'}
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="footer-logo">Vogel Marketing Group</div>
        <div class="footer-tagline">Driving Growth Through Strategic Marketing</div>
        <div class="footer-contact">
          705 Washington Avenue Suite 300<br>
          Miami Beach, Florida 33139<br>
          Email: yourfriends@vmg7.com
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateMarinePDFHTML(clientName, selectedTier, addOns, totals) {
  const marineTiers = {
    wake: {
      name: 'WAKE',
      monthly: 5000,
      mediaIncluded: 2500,
      setup: 1500,
      description: 'Emerging dealers - Turn on the tap (lean)',
      deliverables: [
        '1 primary platform (Google Search/PMax) setup and management',
        'SRP/VDP destination configuration',
        'Up to 2 ad-creative sets per quarter',
        'Speed-to-lead automation setup (instant SMS to rep, auto-reply to lead, missed-call text-back)',
        'Monthly insights report with optimization suggestions',
        'VMG Core Feed setup (≤50 units, 1 source)',
        'UTM tracking and call tracking implementation',
        'Monthly 1-page performance report',
        'Quick wins CRO (labels, CTAs, form IDs)',
        'Promo/copy swap within 3 business days'
      ]
    },
    harbor: {
      name: 'HARBOR',
      monthly: 10000,
      mediaIncluded: 5000,
      setup: 3000,
      description: 'Growth dealers - Own the pipeline (light build)',
      deliverables: [
        'Google + Meta always-on campaign management',
        'Up to 2 micro-LPs/overlays for trade-in/finance capture',
        'Up to 4 ad-creative sets per month',
        '3–5 automated nurture flows (new lead, no-reply, trade-in, finance pre-qual, post-show)',
        '1 BDC huddle per month (call review + talk-tracks)',
        'VMG Core Feed (standard - unlimited units, multiple sources)',
        'YouTube retargeting campaigns',
        'Monthly narrative report + Looker dashboard access',
        'CRO experiments (SRP/VDP prompts, CTA placement)',
        'New model/category launch within 3 business days'
      ]
    },
    offshore: {
      name: 'OFFSHORE',
      monthly: 18000,
      mediaIncluded: 9000,
      setup: 5000,
      description: 'Enterprise dealers - Accelerate turn (dynamic + testing)',
      deliverables: [
        'Google + Meta + YouTube full-funnel campaigns',
        'Dynamic inventory ads with Aged/High-margin/High-turn labels',
        '10–12 ad-creative sets per month (statics + lightweight verticals)',
        '1–2 CRO experiments per month (layout, form friction, CTAs)',
        '2 BDC huddles per month + call library + objection macros',
        'Show strategy with 3-phase bursts (pre/during/post) + geo retargeting',
        'Advanced VMG Core Feed with dynamic inventory management',
        'Up to 4 micro-LPs total (premium categories, finance, trade-in, offer)',
        'Weekly optimization calls + monthly QBR',
        'Feed troubleshooting within 2 business days'
      ]
    }
  };

  const marineAddOns = {
    aiChat: { name: 'AI Chat (site)', price: 400, description: '1 guided FAQ/lead-capture flow; after-hours capture; GA events; monthly light tweak' },
    dmFunnels: { name: 'DM Funnels (FB/IG)', price: 400, description: '1 Messenger/IG DM flow (10–15 nodes) for quotes, trade-in, finance; pushes to GHL' },
    emailSms: { name: 'Email/SMS Campaign', price: { perSend: 600, perMonth: 1500 }, description: '$600/send or $1,500/mo for 4 sends' },
    bdcLite: { name: 'BDC Lite (enablement)', price: 1500, description: '2 role-plays, call review, scripts/macros' },
    creativeBoost: { name: 'Creative Boost', price: 750, description: '+4 creative sets/month' },
    croWebSprint: { name: 'CRO / Web Sprint', price: 3500, description: '1 micro-LP or SRP/VDP experiment + QA + analytics (one-time)' },
    inventoryFeedMgmt: { name: 'Inventory Feed Mgmt', price: { setup: 1500, monthly: 750 }, description: 'Normalize/build feed for Google/Meta; monitor & fix' },
    localSeoBasic: { name: 'Local SEO — Basic', price: 399, description: 'GBP audit/optimization; 2 posts/mo; quarterly citation scan; photo refresh' },
    localSeoPro: { name: 'Local SEO — Pro', price: 799, description: 'Basic + 4 posts/mo; 10 citation builds/fixes M1 then 5/mo; GBP Products/Inventory' },
    reputationMgmt: { name: 'Reputation Mgmt', price: 750, description: 'Review asks + suggested responses (we can post with approval)' },
    showBurst: { name: 'Show Burst Pack', price: 2000, description: 'Pre/during/post sequences; 1 creative set; geo retargeting (per event)' },
    spanishCreative: { name: 'Spanish Creative Pack', price: 500, description: 'Up to 4 sets localized' },
    onsiteProduction: { name: 'On-site Production Day', price: 2500, description: '8–10 edited verticals (per day + travel)' },
    topUps: { name: 'Media Top-Ups', price: 3000, description: '$3,000 each (100% to media)' }
  };

  let tierHTML = '';
  if (selectedTier && marineTiers[selectedTier]) {
    const tier = marineTiers[selectedTier];
    const deliverablesHTML = tier.deliverables.map(d => `<li>${d}</li>`).join('');

    tierHTML = `
      <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid #0ea5e9;">
        <div style="font-weight: 700; color: #1f2937; margin-bottom: 8px; font-size: 18px;">
          ${tier.name} - ${tier.description}
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding: 12px; background: white; border-radius: 8px;">
          <div>
            <div style="color: #6b7280; font-size: 13px;">Monthly Investment</div>
            <div style="font-weight: 700; color: #0ea5e9; font-size: 20px;">$${tier.monthly.toLocaleString()}</div>
          </div>
          <div>
            <div style="color: #6b7280; font-size: 13px;">Media Included</div>
            <div style="font-weight: 700; color: #10b981; font-size: 20px;">$${tier.mediaIncluded.toLocaleString()}</div>
          </div>
          <div>
            <div style="color: #6b7280; font-size: 13px;">Setup Fee</div>
            <div style="font-weight: 700; color: #6b7280; font-size: 20px;">$${tier.setup.toLocaleString()}</div>
          </div>
        </div>
        <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px; font-size: 15px;">Included Deliverables:</div>
        <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.8;">
          ${deliverablesHTML}
        </ul>
      </div>
    `;
  }

  let addOnsHTML = '';
  let hasAddOns = false;

  Object.entries(addOns).forEach(([key, value]) => {
    if ((typeof value === 'boolean' && value) || (typeof value === 'number' && value > 0)) {
      hasAddOns = true;
      const addOn = marineAddOns[key];
      if (!addOn) return;

      let priceText = '';
      let totalPrice = 0;

      if (typeof addOn.price === 'number') {
        totalPrice = addOn.price * (typeof value === 'number' ? value : 1);
        priceText = `$${addOn.price.toLocaleString()}/mo`;
        if (typeof value === 'number' && value > 1) {
          priceText += ` × ${value} = $${totalPrice.toLocaleString()}/mo`;
        }
      } else if (addOn.price.setup) {
        priceText = `$${addOn.price.setup.toLocaleString()} setup + $${addOn.price.monthly?.toLocaleString()}/mo`;
      } else if (addOn.price.perSend) {
        if (value >= 4) {
          priceText = `$${addOn.price.perMonth.toLocaleString()}/mo (4+ sends package)`;
        } else {
          priceText = `$${addOn.price.perSend}/send × ${value} = $${(addOn.price.perSend * value).toLocaleString()}`;
        }
      }

      addOnsHTML += `
        <div style="background: white; padding: 14px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #10b981;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #1f2937; margin-bottom: 4px;">${addOn.name}</div>
              <div style="color: #6b7280; font-size: 13px;">${addOn.description}</div>
            </div>
            <div style="font-weight: 700; color: #10b981; white-space: nowrap; margin-left: 16px;">${priceText}</div>
          </div>
        </div>
      `;
    }
  });

  const addOnsSection = hasAddOns ? `
    <div class="section">
      <div class="section-title">Add-On Services</div>
      <div style="background: #f0fdf4; padding: 16px; border-radius: 12px; border-left: 4px solid #10b981;">
        ${addOnsHTML}
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          color: #1f2937;
          line-height: 1.6;
        }
        .header {
          background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%);
          color: white;
          padding: 40px 0;
          text-align: center;
          margin-bottom: 40px;
        }
        .logo {
          font-size: 32px;
          font-weight: 300;
          letter-spacing: 3px;
          margin-bottom: 8px;
        }
        .tagline {
          font-size: 14px;
          opacity: 0.9;
          font-weight: 300;
        }
        .subtitle {
          font-size: 16px;
          margin-top: 12px;
          font-weight: 400;
          opacity: 0.95;
        }
        .client-name {
          background: rgba(255, 255, 255, 0.2);
          padding: 12px 24px;
          border-radius: 8px;
          margin-top: 20px;
          display: inline-block;
          font-size: 18px;
          font-weight: 400;
        }
        .content {
          padding: 0 40px;
        }
        .section {
          margin-bottom: 32px;
        }
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        .summary-box {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 2px solid #10b981;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #d1fae5;
        }
        .summary-row:last-child {
          border-bottom: none;
          padding-top: 16px;
          border-top: 2px solid #10b981;
        }
        .summary-label {
          font-weight: 600;
          color: #065f46;
        }
        .summary-value {
          font-weight: 700;
          font-size: 24px;
          color: #059669;
        }
        .footer {
          margin-top: 60px;
          padding: 32px 40px;
          background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%);
          color: white;
          text-align: center;
        }
        .footer-logo {
          font-size: 28px;
          font-weight: 300;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }
        .footer-tagline {
          font-size: 14px;
          opacity: 0.8;
          margin-bottom: 20px;
          font-weight: 300;
        }
        .footer-contact {
          font-size: 12px;
          opacity: 0.9;
          line-height: 1.8;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Vogel Marketing Group</div>
        <div class="tagline">Marine & Powersports Growth Playbook</div>
        <div class="subtitle">All-In Growth Solution — One monthly number. More buyers.</div>
        ${clientName ? `<div class="client-name">Prepared for: ${clientName}</div>` : ''}
      </div>

      <div class="content">
        <div class="summary-box">
          <div class="summary-row">
            <span class="summary-label">Monthly Investment:</span>
            <span class="summary-value">$${Math.round(totals.monthlyTotal).toLocaleString()}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Setup Fee:</span>
            <span class="summary-value">$${totals.setupTotal.toLocaleString()}</span>
          </div>
          ${totals.oneTimeTotal > 0 ? `
            <div class="summary-row">
              <span class="summary-label">One-Time Costs:</span>
              <span class="summary-value">$${totals.oneTimeTotal.toLocaleString()}</span>
            </div>
          ` : ''}
          <div class="summary-row">
            <span class="summary-label">6-Month Total Value:</span>
            <span class="summary-value">$${Math.round(totals.annualTotal).toLocaleString()}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Selected Tier & Deliverables</div>
          ${tierHTML}
        </div>

        ${addOnsSection}

        <div class="section">
          <div class="section-title">Contract Terms</div>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #6366f1;">
            <div style="font-weight: 600; color: #1f2937; font-size: 16px; margin-bottom: 8px;">
              6-Month Contract (Standard Terms)
            </div>
            <div style="color: #6b7280; font-size: 14px; line-height: 1.8;">
              • <strong>&lt;5-minute response SLA</strong> required for optimal results<br>
              • Setup fee covers onboarding + strategy session<br>
              • Media spend flexibility: ±10% absorbed by VMG<br>
              • All accounts and data remain client-owned
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="footer-logo">Vogel Marketing Group</div>
        <div class="footer-tagline">Driving Growth Through Strategic Marketing</div>
        <div class="footer-contact">
          705 Washington Avenue Suite 300<br>
          Miami Beach, Florida 33139<br>
          Email: yourfriends@vmg7.com
        </div>
      </div>
    </body>
    </html>
  `;
}

app.listen(PORT, () => {
  console.log(`PDF Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
