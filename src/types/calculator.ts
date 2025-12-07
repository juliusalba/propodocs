export interface CalculatorColumn {
    id: string;
    label: string;
    type: 'text' | 'number' | 'currency' | 'select' | 'formula';
    options?: string[]; // For 'select' type
    formula?: string; // For 'formula' type
}

export interface CalculatorTier {
    id: string;
    name: string;
    description: string;
    monthlyPrice: number;
    setupFee: number;
    features: string[];
}

export interface CalculatorAddOn {
    id: string;
    name: string;
    description: string;
    price: number;
    priceType: 'monthly' | 'one-time' | 'per-unit';
    category?: string;
}

export type CalculatorTheme = 'light' | 'dark' | 'brand';

export interface CalculatorSchema {
    name?: string;
    description?: string;
    layout?: 'tiered' | 'itemized' | 'hybrid';
    theme?: CalculatorTheme;
    tiers?: CalculatorTier[];
    addOns?: CalculatorAddOn[];
    columns: CalculatorColumn[];
    clientFields?: string[];
}

export interface CalculatorDefinition {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    schema: CalculatorSchema;
    created_at: string;
    updated_at: string;
}

export interface CalculatorRow {
    id: string;
    [key: string]: any;
}

export interface CalculatorTotals {
    monthlyTotal: number;
    setupTotal: number;
    oneTimeTotal: number;
    annualTotal: number;
}
