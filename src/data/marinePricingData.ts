import type { MarineTier, MarineAddOn } from '../types/marine';

export const marineTiers: Record<'wake' | 'harbor' | 'offshore', MarineTier> = {
    wake: {
        name: 'WAKE',
        monthly: 5000,
        mediaIncluded: 2500,
        setup: 1500,
        description: 'Emerging dealers - Turn on the tap',
        features: [
            '1 primary platform (Google Search/PMax)',
            'SRP/VDP destinations only',
            'Up to 2 ad-creative sets/quarter',
            'Speed-to-lead automations',
            'Monthly insights & suggestions',
            'Propodocs Core Feed (≤50 units, 1 source)'
        ]
    },
    harbor: {
        name: 'HARBOR',
        monthly: 10000,
        mediaIncluded: 5000,
        setup: 3000,
        description: 'Growth dealers - Own the pipeline (Hero tier)',
        features: [
            'Google + Meta always-on',
            'Up to 2 micro-LPs/overlays',
            'Up to 4 ad-creative sets/month',
            '3–5 automated nurture flows',
            '1 BDC huddle/month',
            'Propodocs Core Feed (standard)'
        ]
    },
    offshore: {
        name: 'OFFSHORE',
        monthly: 18000,
        mediaIncluded: 9000,
        setup: 5000,
        description: 'Enterprise dealers - Accelerate turn',
        features: [
            'Google + Meta + YouTube',
            'Dynamic inventory ads (Aged/High-margin/High-turn)',
            '10–12 ad-creative sets/month',
            '1–2 experiments/month',
            '2 BDC huddles/month',
            'Show strategy (pre/during/post bursts)'
        ]
    }
};

export const marineAddOns: Record<string, MarineAddOn> = {
    aiChat: {
        name: 'AI Chat (site)',
        price: 400,
        description: '1 guided FAQ/lead-capture flow; after-hours capture; GA events; monthly light tweak',
        category: 'conversational'
    },
    dmFunnels: {
        name: 'DM Funnels (FB/IG)',
        price: 400,
        description: '1 Messenger/IG DM flow (10–15 nodes) for quotes, trade-in, finance; pushes to GHL',
        category: 'conversational'
    },
    emailSms: {
        name: 'Email/SMS Campaign',
        price: { perSend: 600, perMonth: 1500 },
        description: '$600/send or $1,500/mo for 4 sends',
        category: 'email'
    },
    bdcLite: {
        name: 'BDC Lite (enablement)',
        price: 1500,
        description: '2 role-plays, call review, scripts/macros',
        category: 'email'
    },
    creativeBoost: {
        name: 'Creative Boost',
        price: 750,
        description: '+4 creative sets/month',
        category: 'creative'
    },
    croWebSprint: {
        name: 'CRO / Web Sprint',
        price: 3500,
        description: '1 micro-LP or SRP/VDP experiment + QA + analytics (one-time)',
        category: 'creative'
    },
    inventoryFeedMgmt: {
        name: 'Inventory Feed Mgmt',
        price: { setup: 1500, monthly: 750 },
        description: 'Normalize/build feed for Google/Meta; monitor & fix ($500–$1,000/mo avg $750)',
        category: 'creative'
    },
    localSeoBasic: {
        name: 'Local SEO — Basic',
        price: 399,
        description: 'GBP audit/optimization; 2 posts/mo; quarterly citation scan; photo refresh',
        category: 'local'
    },
    localSeoPro: {
        name: 'Local SEO — Pro',
        price: 799,
        description: 'Basic + 4 posts/mo; 10 citation builds/fixes M1 then 5/mo; GBP Products/Inventory',
        category: 'local'
    },
    reputationMgmt: {
        name: 'Reputation Mgmt',
        price: 750,
        description: 'Review asks + suggested responses (we can post with approval)',
        category: 'local'
    },
    showBurst: {
        name: 'Show Burst Pack',
        price: 2000,
        description: 'Pre/during/post sequences; 1 creative set; geo retargeting (per event)',
        category: 'events'
    },
    spanishCreative: {
        name: 'Spanish Creative Pack',
        price: 500,
        description: 'Up to 4 sets localized',
        category: 'creative'
    },
    onsiteProduction: {
        name: 'On-site Production Day',
        price: 2500,
        description: '8–10 edited verticals (per day + travel)',
        category: 'events'
    },
    topUps: {
        name: 'Media Top-Ups',
        price: 3000,
        description: '$3,000 each (100% to media)',
        category: 'creative'
    }
};
