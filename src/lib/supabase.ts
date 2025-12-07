import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types based on schema
export interface User {
    id: number;
    email: string;
    name: string;
    company?: string;
    role: 'user' | 'admin';
    created_at: string;
    updated_at: string;
}

export interface Proposal {
    id: number;
    user_id: number;
    title: string;
    client_name: string;
    calculator_type: 'vmg' | 'marine' | 'marketing' | 'custom';
    calculator_data: Record<string, unknown>;
    content?: Record<string, unknown>;
    theme?: Record<string, unknown>;
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected';
    created_at: string;
    updated_at: string;
}

export interface ProposalLink {
    id: number;
    proposal_id: number;
    token: string;
    password_hash?: string;
    expires_at?: string;
    max_views?: number;
    view_count: number;
    is_active: boolean;
    created_at: string;
}

export interface ProposalView {
    id: number;
    proposal_id: number;
    link_id?: number;
    session_id: string;
    ip_address?: string;
    user_agent?: string;
    device_type?: string;
    browser?: string;
    os?: string;
    location?: string;
    duration_seconds: number;
    viewed_at: string;
}

export interface ProposalInteraction {
    id: number;
    view_id: number;
    proposal_id: number;
    interaction_type: 'click' | 'scroll' | 'hover';
    element_id?: string;
    element_type?: string;
    x_position?: number;
    y_position?: number;
    scroll_depth?: number;
    timestamp: string;
}

export interface ProposalComment {
    id: number;
    proposal_id: number;
    user_id?: number;
    author_name: string;
    content: string;
    is_internal: boolean;
    created_at: string;
}

export interface ProposalTemplate {
    id: number;
    user_id: number;
    name: string;
    description?: string;
    content_structure: Record<string, unknown>;
    theme?: Record<string, unknown>;
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface Notification {
    id: number;
    user_id: number;
    type: 'view' | 'accept' | 'comment';
    title: string;
    message: string;
    data?: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
}