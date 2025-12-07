// Type definitions for database schema
// Note: This file contains TypeScript interfaces for the Supabase database schema
// The actual database is managed by Supabase, not SQLite

export interface User {
    id: number;
    email: string;
    password: string; // Hashed password stored in Supabase
    name: string;
    company?: string;
    role?: 'user' | 'admin';
    created_at: string;
    updated_at: string;
}

export interface Proposal {
    id: number;
    user_id: number;
    title: string;
    client_name: string;
    client_email?: string;
    client_company?: string;
    calculator_type: 'vmg' | 'marine' | 'marketing' | 'custom';
    calculator_data: Record<string, unknown>; // JSONB in Supabase
    content?: Record<string, unknown>; // JSONB - AI-generated or custom content
    template_id?: number;
    theme?: Record<string, unknown>; // JSONB - color scheme, fonts, etc.
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
    duration_seconds?: number;
    viewed_at: string;
}

export interface ProposalInteraction {
    id: number;
    view_id: number;
    proposal_id: number;
    interaction_type: 'click' | 'scroll' | 'hover' | 'focus';
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
    is_internal?: boolean;
    section_id?: string;
    parent_id?: number;
    created_at: string;
}

export interface ProposalTemplate {
    id: number;
    user_id: number;
    name: string;
    description?: string;
    content_structure: Record<string, unknown>; // JSONB
    theme?: Record<string, unknown>; // JSONB
    is_public: boolean;
    created_at: string;
    updated_at: string;
}

export interface Notification {
    id: number;
    user_id: number;
    proposal_id?: number;
    type: 'view' | 'accept' | 'comment' | 'proposal_viewed' | 'proposal_accepted' | 'proposal_rejected' | 'comment_added' | 'link_expired';
    title: string;
    message: string;
    data?: Record<string, unknown>; // JSONB
    is_read: boolean;
    created_at: string;
}
