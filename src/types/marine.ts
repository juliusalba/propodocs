export interface MarineTier {
    name: string;
    monthly: number;
    mediaIncluded: number;
    setup: number;
    description: string;
    features: string[];
}

export interface MarineAddOn {
    name: string;
    price: number | { setup?: number; monthly?: number; perSend?: number; perMonth?: number };
    description: string;
    category: 'conversational' | 'email' | 'creative' | 'local' | 'events';
}

export interface MarineAddOnsState {
    aiChat: boolean;
    dmFunnels: boolean;
    emailSms: number; // number of sends
    bdcLite: boolean;
    creativeBoost: boolean;
    croWebSprint: number; // count
    inventoryFeedMgmt: boolean;
    localSeoBasic: boolean;
    localSeoPro: boolean;
    reputationMgmt: boolean;
    showBurst: number; // count
    spanishCreative: boolean;
    onsiteProduction: number; // days
    topUps: number; // count of $3k top-ups
}

export interface MarineQuote {
    tier: 'wake' | 'harbor' | 'offshore' | null;
    addOns: MarineAddOnsState;
    contractTerm: '6';
    clientName: string;
}
