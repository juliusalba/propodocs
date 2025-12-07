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

export interface ClientDetails {
    name: string;
    company: string;
    email: string;
    phone: string;
    address: string;
}

export interface ProposalComment {
    id: number;
    proposal_id: number;
    user_id?: string;
    author_name: string;
    content: string;
    highlighted_text?: string;
    block_id?: string;
    parent_comment_id?: number;
    is_resolved?: boolean;
    is_internal: boolean;
    created_at: string;
    replies?: ProposalComment[];
}

export interface BlockChange {
    id: number;
    proposal_id: number;
    block_id: string;
    previous_content: any;
    new_content: any;
    changed_by?: string;
    created_at: string;
}

export interface ViewSession {
    id: number;
    session_id: string;
    viewed_at: string;
    duration_seconds: number;
    device_type: string;
    browser: string;
    location?: string;
}

export interface Proposal {
    id: number;
    title: string;
    client_name: string;
    client_company?: string;
    client_email?: string;
    client_phone?: string;
    client_address?: string;
    calculator_type: 'vmg' | 'marine' | 'marketing' | 'custom';
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
    created_at: string;
    updated_at: string;
    view_count: number;
    comment_count: number;
    calculator_data: any;
    content: any;
    theme: any;
    cover_photo_url?: string;
    author?: string;
    view_sessions?: ViewSession[];
}
