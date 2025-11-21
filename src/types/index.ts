export interface Tier {
    monthly: number;
    setup: number;
    internalCost: number;
    description: string;
}

export interface Service {
    name: string;
    tiers: {
        [key: number]: Tier;
    };
}

export interface ServicesData {
    traffic: Service;
    retention: Service;
    creative: Service;
}

export interface AddOnPrices {
    landingPages: number;
    funnels: number;
    dashboard: {
        setup: number;
        monthly: number;
    };
    workshop: {
        halfDay: number;
        fullDay: number;
    };
    videoPack: number;
}

export interface AddOnsState {
    landingPages: number;
    funnels: number;
    dashboard: boolean;
    workshop: 'halfDay' | 'fullDay' | null;
    videoPack: number;
}

export interface SelectedServices {
    traffic: number | null;
    retention: number | null;
    creative: number | null;
}
