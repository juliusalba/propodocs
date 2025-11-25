import type { ServicesData, AddOnPrices } from '../types';

export const services: ServicesData = {
    traffic: {
        name: "Traffic Driver",
        tiers: {
            1: { monthly: 7500, setup: 3750, internalCost: 2800, description: "Google + Meta management up to $5K ad spend" },
            2: { monthly: 12500, setup: 6250, internalCost: 5000, description: "Google + Meta + LinkedIn up to $15K ad spend (Growth Accelerator)" },
            3: { monthly: 19000, setup: 9500, internalCost: 7500, description: "All channels including TikTok up to $50K ad spend (Enterprise Performance Ecosystem)" }
        }
    },
    retention: {
        name: "Retention & CRM",
        tiers: {
            1: { monthly: 3500, setup: 1750, internalCost: 1200, description: "3 basic email flows with templates" },
            2: { monthly: 6000, setup: 3000, internalCost: 2400, description: "Full lifecycle automation with A/B testing" },
            3: { monthly: 9250, setup: 4625, internalCost: 3750, description: "Multi-channel CRM (email, SMS, WhatsApp) with AI segmentation" }
        }
    },
    creative: {
        name: "Creative Support",
        tiers: {
            1: { monthly: 2500, setup: 1250, internalCost: 1000, description: "8-10 ad creatives/month, 5-day turnaround (Creative Support)" },
            2: { monthly: 5000, setup: 2500, internalCost: 2000, description: "15-20 creatives/month with video, 3-day turnaround (Creative Growth Pack)" },
            3: { monthly: 8250, setup: 4125, internalCost: 3250, description: "Unlimited creative requests, 48-hour turnaround (Creative Engine)" }
        }
    }
};

export const addOnPrices: AddOnPrices = {
    landingPages: 2500,
    funnels: 6250,
    dashboard: { setup: 2000, monthly: 500 },
    workshop: { halfDay: 3500, fullDay: 6000 },
    videoPack: 4000
};
