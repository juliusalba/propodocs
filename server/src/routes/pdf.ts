import express from 'express';
import puppeteer from 'puppeteer';

const router = express.Router();

// VMG PDF Generation
router.post('/generate-pdf', async (req, res) => {
    console.log('PDF generation request received');
    let browser;
    try {
        const { clientName, selectedServices, addOns, contractTerm, totals, coverPhotoUrl } = req.body;
        console.log('Request data:', { clientName, selectedServices, contractTerm });

        const htmlContent = generatePDFHTML(clientName, selectedServices, addOns, contractTerm, totals, coverPhotoUrl);

        console.log('Launching Puppeteer...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        console.log('Generating PDF...');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
        });

        await browser.close();
        console.log('PDF generated successfully');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=VMG-Quote-${clientName || 'Client'}.pdf`);
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Error generating PDF:', error);
        if (browser) await browser.close();
        res.status(500).json({ error: 'Failed to generate PDF', message: error.message });
    }
});

// Custom Calculator PDF Generation
router.post('/generate-custom-pdf', async (req, res) => {
    console.log('Custom PDF generation request received');
    let browser;
    try {
        const {
            clientName,
            calculatorName,
            rows,
            totals,
            discount,
            clientDetails,
            scope,
            coverPhotoUrl,
            selectedTier,
            selectedAddOns,
            detailedBreakdown
        } = req.body;
        console.log('Request data:', {
            clientName,
            calculatorName,
            scopeLength: scope?.length,
            hasTier: !!selectedTier,
            addOnCount: selectedAddOns?.length || 0,
            hasDetailedBreakdown: !!detailedBreakdown
        });

        const htmlContent = generateCustomPDFHTML(
            clientName,
            calculatorName,
            rows,
            totals,
            discount,
            clientDetails,
            scope,
            coverPhotoUrl,
            selectedTier,
            selectedAddOns,
            detailedBreakdown
        );

        console.log('Launching Puppeteer...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        console.log('Generating Custom PDF...');
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
        });

        await browser.close();
        console.log('Custom PDF generated successfully');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${calculatorName.replace(/\s+/g, '-')}-${clientName || 'Client'}.pdf`);
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Error generating Custom PDF:', error);
        console.error('Error stack:', error.stack);
        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error('Error closing browser:', closeError);
            }
        }
        res.status(500).json({
            error: 'Failed to generate PDF',
            message: error.message,
            hint: 'This may be a server-side issue with PDF generation. Please try again.'
        });
    }
});

// Helper Functions

function generateCustomPDFHTML(
    clientName: string,
    calculatorName: string,
    rows: any[],
    totals: any,
    discount: any,
    clientDetails: any,
    scope?: string,
    coverPhotoUrl?: string,
    selectedTier?: any,
    selectedAddOns?: any[],
    detailedBreakdown?: {
        tier: any;
        addOns: any[];
    }
) {
    // Generate Line Items HTML from tier and add-ons
    let lineItemsHTML = '';

    if (detailedBreakdown) {
        // use detailed breakdown if available
        const items: string[] = [];

        // Tier Breakdown
        if (detailedBreakdown.tier && selectedTier) {
            const tier = detailedBreakdown.tier;
            const deliverablesList = tier.deliverables.map((d: string) => `<li>${d}</li>`).join('');
            const specsList = tier.technicalSpecs?.map((s: string) => `<li>${s}</li>`).join('') || '';

            items.push(`
                <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #0ea5e9;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                        <div>
                            <div style="font-weight: 700; color: #1f2937; font-size: 18px;">${selectedTier.name}</div>
                            <div style="color: #6b7280; font-size: 14px;">${selectedTier.description || tier.description}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-weight: 700; color: #0ea5e9; font-size: 20px;">$${(selectedTier.monthlyPrice || 0).toLocaleString()}/mo</div>
                            ${selectedTier.setupFee ? `<div style="font-size: 13px; color: #6b7280;">+$${selectedTier.setupFee.toLocaleString()} setup</div>` : ''}
                        </div>
                    </div>
                    
                    <div style="margin-top: 16px;">
                        <div style="font-weight: 600; color: #0ea5e9; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Included Deliverables</div>
                        <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 1.6; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; column-gap: 20px;">
                            ${deliverablesList}
                        </ul>
                    </div>

                    ${specsList ? `
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e0f2fe;">
                        <div style="font-weight: 600; color: #64748b; font-size: 13px; margin-bottom: 8px; text-transform: uppercase;">Technical Specifications</div>
                        <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 13px; line-height: 1.5; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                            ${specsList}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            `);
        }

        // Add-ons Breakdown
        if (detailedBreakdown.addOns && detailedBreakdown.addOns.length > 0) {
            items.push(`<div style="font-weight: 700; color: #1f2937; font-size: 16px; margin-bottom: 16px; margin-top: 32px;">Additional Services</div>`);

            detailedBreakdown.addOns.forEach((addon: any, index: number) => {
                const originalAddon = selectedAddOns?.[index];
                const price = originalAddon ? (originalAddon.total || originalAddon.price || 0) : 0;
                const priceLabel = originalAddon?.priceType === 'monthly' ? '/mo' : ' (one-time)';
                const qtyText = originalAddon?.quantity > 1 ? ` ×${originalAddon.quantity}` : '';

                const deliverablesList = addon.deliverables.slice(0, 4).map((d: string) => `<li>${d}</li>`).join('');

                items.push(`
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <div style="font-weight: 600; color: #1f2937;">${addon.name}${qtyText}</div>
                            <div style="font-weight: 600; color: #475569;">$${price.toLocaleString()}${priceLabel}</div>
                        </div>
                        <div style="font-size: 13px; color: #64748b; margin-bottom: 8px;">${addon.description}</div>
                        <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.5;">
                            ${deliverablesList}
                        </ul>
                        <div style="font-size: 12px; color: #94a3b8; margin-top: 8px; font-style: italic;">Timeline: ${addon.timeline}</div>
                    </div>
                `);
            });
        }

        lineItemsHTML = items.join('');

    } else if (selectedTier || (selectedAddOns && selectedAddOns.length > 0)) {
        const items: string[] = [];

        // Add tier
        if (selectedTier) {
            items.push(`
                <div style="display: flex; justify-content: space-between; padding: 12px 16px; background: #f0f9ff; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #0ea5e9;">
                    <div>
                        <div style="font-weight: 600; color: #1f2937;">${selectedTier.name}</div>
                        <div style="font-size: 12px; color: #6b7280;">${selectedTier.description || 'Selected Tier'}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: #0ea5e9;">$${(selectedTier.monthlyPrice || 0).toLocaleString()}/mo</div>
                        ${selectedTier.setupFee ? `<div style="font-size: 12px; color: #6b7280;">+$${selectedTier.setupFee.toLocaleString()} setup</div>` : ''}
                    </div>
                </div>
            `);
        }

        // Add add-ons
        if (selectedAddOns && selectedAddOns.length > 0) {
            selectedAddOns.forEach((addon: any) => {
                const qtyText = addon.quantity > 1 ? ` ×${addon.quantity}` : '';
                const priceLabel = addon.priceType === 'monthly' ? '/mo' : '';
                items.push(`
                    <div style="display: flex; justify-content: space-between; padding: 12px 16px; background: #f8fafc; border-radius: 8px; margin-bottom: 8px;">
                        <div>
                            <div style="font-weight: 500; color: #1f2937;">${addon.name}${qtyText}</div>
                            ${addon.description ? `<div style="font-size: 12px; color: #6b7280;">${addon.description}</div>` : ''}
                        </div>
                        <div style="font-weight: 600; color: #374151;">$${(addon.total || addon.price || 0).toLocaleString()}${priceLabel}</div>
                    </div>
                `);
            });
        }

        lineItemsHTML = items.join('');
    }

    // Legacy: Generate Rows HTML for itemized calculators
    let rowsHTML = '';
    if (rows && rows.length > 0 && !selectedTier && (!selectedAddOns || selectedAddOns.length === 0)) {
        rowsHTML = rows.map(row => {
            const displayFields = Object.entries(row).filter(([key]) => key !== 'id' && key !== 'isHeader');
            const cells = displayFields.map(([key, value]) => `
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${value}</td>
            `).join('');
            return `<tr>${cells}</tr>`;
        }).join('');
    }

    // Dynamic headers based on first row keys (excluding id)
    let headersHTML = '';
    if (rows && rows.length > 0 && !selectedTier && (!selectedAddOns || selectedAddOns.length === 0)) {
        const headers = Object.keys(rows[0]).filter(key => key !== 'id');
        headersHTML = headers.map(key => `
            <th style="text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; color: #1f2937; font-weight: 600; text-transform: capitalize;">${key.replace(/_/g, ' ')}</th>
        `).join('');
    }

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: #1f2937; line-height: 1.6; }
                .header { background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%); color: white; padding: 40px 0; text-align: center; margin-bottom: 40px; }
                .logo { font-size: 32px; font-weight: 300; letter-spacing: 3px; margin-bottom: 8px; }
                .tagline { font-size: 14px; opacity: 0.9; font-weight: 300; }
                .client-name { background: rgba(255, 255, 255, 0.2); padding: 12px 24px; border-radius: 8px; margin-top: 20px; display: inline-block; font-size: 18px; font-weight: 400; }
                .content { padding: 0 40px; }
                .section { margin-bottom: 32px; }
                .section-title { font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
                .summary-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 12px; padding: 24px; margin-bottom: 32px; }
                .summary-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #d1fae5; }
                .summary-row:last-child { border-bottom: none; padding-top: 16px; border-top: 2px solid #10b981; }
                .summary-label { font-weight: 600; color: #065f46; }
                .summary-value { font-weight: 700; font-size: 24px; color: #059669; }
                .table-container { width: 100%; overflow-x: auto; margin-bottom: 32px; }
                table { width: 100%; border-collapse: collapse; font-size: 14px; }
                .footer { margin-top: 60px; padding: 32px 40px; background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%); color: white; text-align: center; }
                .footer-logo { font-size: 28px; font-weight: 300; letter-spacing: 2px; margin-bottom: 12px; }
                .footer-tagline { font-size: 14px; opacity: 0.8; margin-bottom: 20px; font-weight: 300; }
                .footer-contact { font-size: 12px; opacity: 0.9; line-height: 1.8; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">Propodocs</div>
                <div class="tagline">${calculatorName}</div>
                ${clientName ? `<div class="client-name">Prepared for: ${clientName}</div>` : ''}
            </div>

            <div class="content">
                <div class="summary-box">
                    <div class="summary-row">
                        <span class="summary-label">Monthly Total:</span>
                        <span class="summary-value">$${Math.round(totals?.monthlyTotal || 0).toLocaleString()}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Setup Fee:</span>
                        <span class="summary-value">$${(totals?.setupTotal || 0).toLocaleString()}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Annual Value:</span>
                        <span class="summary-value">$${Math.round(totals?.annualTotal || 0).toLocaleString()}</span>
                    </div>
                </div>

                ${lineItemsHTML ? `
                <div class="section">
                    <div class="section-title">Investment Breakdown</div>
                    ${lineItemsHTML}
                </div>
                ` : ''}

                ${rowsHTML ? `
                <div class="section">
                    <div class="section-title">Investment Breakdown</div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>${headersHTML}</tr>
                            </thead>
                            <tbody>
                                ${rowsHTML}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}

                ${scope ? `
                <div class="section">
                    <div class="section-title">Scope of Work</div>
                    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; white-space: pre-wrap;">${scope}</div>
                </div>
                ` : ''}

                ${clientDetails ? `
                <div class="section">
                    <div class="section-title">Client Details</div>
                    <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
                            <div>
                                <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">Contact Name</div>
                                <div style="color: #1f2937; font-weight: 500;">${clientDetails.name || '-'}</div>
                            </div>
                            <div>
                                <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">Company</div>
                                <div style="color: #1f2937; font-weight: 500;">${clientDetails.company || '-'}</div>
                            </div>
                            <div>
                                <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">Email</div>
                                <div style="color: #1f2937; font-weight: 500;">${clientDetails.email || '-'}</div>
                            </div>
                            <div>
                                <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">Address</div>
                                <div style="color: #1f2937; font-weight: 500;">${clientDetails.address || '-'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

            </div>
            <div class="footer">
                <div class="footer-logo">Propodocs</div>
                <div class="footer-tagline">Proposal Management Platform</div>
                <div class="footer-contact">Professional Proposal Solutions</div>
            </div>
        </body>
        </html>
    `;
}

function generatePDFHTML(clientName: string, selectedServices: any, addOns: any, contractTerm: string, totals: any, coverPhotoUrl?: string) {
    const services: Record<string, any> = {
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

    const addOnPrices: Record<string, any> = {
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
            const tierData = service.tiers[tier as number];
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
    if (addOns?.landingPages > 0) {
        addOnsHTML += `<li>${addOns.landingPages} Landing Page${addOns.landingPages > 1 ? 's' : ''} - $${(addOns.landingPages * addOnPrices.landingPages).toLocaleString()}</li>`;
    }
    if (addOns?.funnels > 0) {
        addOnsHTML += `<li>${addOns.funnels} Sales Funnel${addOns.funnels > 1 ? 's' : ''} - $${(addOns.funnels * addOnPrices.funnels).toLocaleString()}</li>`;
    }
    if (addOns?.dashboard) {
        addOnsHTML += `<li>Analytics Dashboard - $${addOnPrices.dashboard.setup.toLocaleString()} setup + $${addOnPrices.dashboard.monthly}/mo</li>`;
    }
    if (addOns?.workshop) {
        const workshopPrice = addOns.workshop === 'halfDay' ? addOnPrices.workshop.halfDay : addOnPrices.workshop.fullDay;
        addOnsHTML += `<li>Strategy Workshop (${addOns.workshop === 'halfDay' ? 'Half-day' : 'Full-day'}) - $${workshopPrice.toLocaleString()}</li>`;
    }
    if (addOns?.videoPack > 0) {
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

    // Generate Deliverables
    const deliverables = generateVMGDeliverables(selectedServices, addOns);
    const deliverablesHTML = deliverables.map(section => `
        <div style="margin-bottom: 20px;">
            <div style="font-weight: 700; color: #1f2937; margin-bottom: 8px; font-size: 15px;">${section.title}</div>
            <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.6;">
                ${section.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `).join('');

    // Generate Scope
    const scope = generateVMGScope(selectedServices);
    const scopeHTML = `
        <div style="display: flex; gap: 20px;">
            <div style="flex: 1; background: #f0fdf4; padding: 16px; border-radius: 8px;">
                <div style="font-weight: 700; color: #166534; margin-bottom: 8px; font-size: 15px;">Included</div>
                <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 13px; line-height: 1.6;">
                    ${scope.inclusions.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            <div style="flex: 1; background: #fef2f2; padding: 16px; border-radius: 8px;">
                <div style="font-weight: 700; color: #991b1b; margin-bottom: 8px; font-size: 15px;">Not Included</div>
                <ul style="margin: 0; padding-left: 20px; color: #991b1b; font-size: 13px; line-height: 1.6;">
                    ${scope.exclusions.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: #1f2937; line-height: 1.6; }
                .header { background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%); color: white; padding: 40px 0; text-align: center; margin-bottom: 40px; }
                .logo { font-size: 32px; font-weight: 300; letter-spacing: 3px; margin-bottom: 8px; }
                .tagline { font-size: 14px; opacity: 0.9; font-weight: 300; }
                .client-name { background: rgba(255, 255, 255, 0.2); padding: 12px 24px; border-radius: 8px; margin-top: 20px; display: inline-block; font-size: 18px; font-weight: 400; }
                .content { padding: 0 40px; }
                .section { margin-bottom: 32px; }
                .section-title { font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
                .summary-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 12px; padding: 24px; margin-bottom: 32px; }
                .summary-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #d1fae5; }
                .summary-row:last-child { border-bottom: none; padding-top: 16px; border-top: 2px solid #10b981; }
                .summary-label { font-weight: 600; color: #065f46; }
                .summary-value { font-weight: 700; font-size: 24px; color: #059669; }
                .footer { margin-top: 60px; padding: 32px 40px; background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%); color: white; text-align: center; }
                .footer-logo { font-size: 28px; font-weight: 300; letter-spacing: 2px; margin-bottom: 12px; }
                .footer-tagline { font-size: 14px; opacity: 0.8; margin-bottom: 20px; font-weight: 300; }
                .footer-contact { font-size: 12px; opacity: 0.9; line-height: 1.8; }
                .cover-photo { width: 100%; height: 300px; object-fit: cover; margin-bottom: 40px; border-radius: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">Propodocs</div>
                <div class="tagline">Professional Marketing Solutions</div>
                ${clientName ? `<div class="client-name">Prepared for: ${clientName}</div>` : ''}
            </div>
            
            <div class="content">
                ${coverPhotoUrl ? `<img src="${coverPhotoUrl}" class="cover-photo" />` : ''}

                <div class="summary-box">
                    <div class="summary-row">
                        <span class="summary-label">Monthly Investment:</span>
                        <span class="summary-value">$${Math.round(totals?.monthlyTotal || 0).toLocaleString()}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Setup Fee:</span>
                        <span class="summary-value">$${(totals?.setupTotal || 0).toLocaleString()}</span>
                    </div>
                    <div class="summary-row">
                        <span class="summary-label">Annual Value:</span>
                        <span class="summary-value">$${Math.round(totals?.annualTotal || 0).toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">Selected Services</div>
                    ${servicesHTML}
                </div>
                
                ${addOnsSection ? `<div class="section"><div class="section-title">Add-on Services</div>${addOnsSection}</div>` : ''}
                
                <div class="section">
                    <div class="section-title">Deliverables</div>
                    ${deliverablesHTML}
                </div>

                <div class="section">
                    <div class="section-title">Scope of Work</div>
                    ${scopeHTML}
                </div>

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
                <div class="footer-logo">Propodocs</div>
                <div class="footer-tagline">Proposal Management Platform</div>
                <div class="footer-contact">Professional Proposal Solutions</div>
            </div>
        </body>
        </html>
    `;
}

// Logic Helpers

function generateVMGDeliverables(selectedServices: any, addOns: any) {
    const deliverables: { title: string; items: string[] }[] = [];

    // Traffic Driver
    if (selectedServices?.traffic) {
        const tier = selectedServices.traffic;
        const tierData: any = {
            1: {
                title: 'Traffic Driver - Tier 1',
                items: [
                    'Up to $10K monthly ad spend management',
                    'Facebook & Instagram advertising',
                    'Basic campaign setup and optimization',
                    'Monthly performance reports',
                    'Email support'
                ]
            },
            2: {
                title: 'Traffic Driver - Tier 2',
                items: [
                    'Up to $25K monthly ad spend management',
                    'Multi-platform advertising (Facebook, Instagram, Google)',
                    'Advanced targeting and audience segmentation',
                    'A/B testing and creative optimization',
                    'Bi-weekly performance reports',
                    'Priority email and phone support'
                ]
            },
            3: {
                title: 'Traffic Driver - Tier 3',
                items: [
                    'Up to $50K monthly ad spend management',
                    'Enterprise-level multi-channel campaigns',
                    'TikTok, LinkedIn, and emerging platform integration',
                    'Advanced attribution modeling',
                    'Custom dashboard and real-time reporting',
                    'Weekly strategy calls',
                    'Dedicated account manager'
                ]
            }
        };
        if (tierData[tier]) deliverables.push(tierData[tier]);
    }

    // Creative Support
    if (selectedServices?.creative) {
        const tier = selectedServices.creative;
        const tierData: any = {
            1: {
                title: 'Creative Support - Tier 1',
                items: [
                    '5-10 creatives per month',
                    'Static images and basic graphics',
                    '5-day turnaround time',
                    'Standard brand pack',
                    '2 revision rounds per creative'
                ]
            },
            2: {
                title: 'Creative Support - Tier 2',
                items: [
                    '15-20 creatives per month',
                    'Video content (up to 30 seconds)',
                    '3-day turnaround time',
                    'Premium brand pack with guidelines',
                    'Unlimited revisions',
                    'Motion graphics and animations'
                ]
            },
            3: {
                title: 'Creative Support - Tier 3',
                items: [
                    '30+ creatives per month',
                    'Long-form video production',
                    'Same-day turnaround available',
                    'Comprehensive brand strategy',
                    'Dedicated creative team',
                    'Advanced motion graphics and 3D elements',
                    'Photography and videography services'
                ]
            }
        };
        if (tierData[tier]) deliverables.push(tierData[tier]);
    }

    // Retention & CRM
    if (selectedServices?.retention) {
        const tier = selectedServices.retention;
        const tierData: any = {
            1: {
                title: 'Retention & CRM - Tier 1',
                items: [
                    'Basic email campaign setup',
                    'Welcome series automation',
                    'Monthly newsletter',
                    'Basic segmentation',
                    'Performance tracking'
                ]
            },
            2: {
                title: 'Retention & CRM - Tier 2',
                items: [
                    'Full lifecycle automation',
                    'Advanced segmentation and personalization',
                    'A/B testing for email campaigns',
                    'SMS marketing integration',
                    'Cart abandonment flows',
                    'Customer win-back campaigns'
                ]
            },
            3: {
                title: 'Retention & CRM - Tier 3',
                items: [
                    'Enterprise CRM implementation',
                    'Predictive analytics and AI-powered recommendations',
                    'Omnichannel marketing automation',
                    'Custom integration with existing systems',
                    'Advanced reporting and attribution',
                    'Dedicated retention strategist'
                ]
            }
        };
        if (tierData[tier]) deliverables.push(tierData[tier]);
    }

    // Add-ons
    if (addOns) {
        const addOnItems: string[] = [];
        if (addOns.landingPages > 0) {
            addOnItems.push(`${addOns.landingPages} Custom Landing Page(s) - High-converting design with A/B testing`);
        }
        if (addOns.funnels > 0) {
            addOnItems.push(`${addOns.funnels} Sales Funnel(s) - Complete funnel strategy and implementation`);
        }
        if (addOns.analytics) {
            addOnItems.push('Advanced Analytics Dashboard - Real-time insights and custom reporting');
        }
        if (addOns.workshop) {
            addOnItems.push('Strategy Workshop - Half-day session with senior strategists');
        }
        if (addOns.videoPacks > 0) {
            addOnItems.push(`${addOns.videoPacks} Video/Motion Pack(s) - Professional video production`);
        }

        if (addOnItems.length > 0) {
            deliverables.push({
                title: 'Add-on Services',
                items: addOnItems
            });
        }
    }

    return deliverables;
}

function generateVMGScope(selectedServices: any) {
    const inclusions: string[] = [
        'Strategic planning and campaign development',
        'Regular performance monitoring and optimization',
        'Monthly reporting and analytics',
        'Dedicated account management',
        'Access to proprietary marketing tools and platforms'
    ];

    const exclusions: string[] = [
        'Third-party advertising costs (ad spend)',
        'Stock photography or premium assets (unless specified)',
        'Website development or major technical changes',
        'Print or traditional media advertising',
        'Services outside selected tiers and add-ons'
    ];

    if (selectedServices?.traffic) {
        inclusions.push('Multi-platform advertising campaign management');
        inclusions.push('Audience research and targeting strategy');
    }

    if (selectedServices?.creative) {
        inclusions.push('Custom creative asset production');
        inclusions.push('Brand guidelines adherence');
    }

    if (selectedServices?.retention) {
        inclusions.push('Email marketing automation setup');
        inclusions.push('Customer segmentation and lifecycle marketing');
    }

    return { inclusions, exclusions };
}

export default router;
