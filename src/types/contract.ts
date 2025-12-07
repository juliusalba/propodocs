// Contract & Contract Template Types

export interface ContractPlaceholder {
    key: string;
    label: string;
    type: 'text' | 'email' | 'date' | 'currency' | 'textarea' | 'number';
    value?: string;
}

export interface ContractTemplate {
    id: number;
    user_id?: number;
    name: string;
    description?: string;
    content: string; // Rich text with {{placeholders}}
    placeholders: ContractPlaceholder[];
    category?: string;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface ContractDeliverable {
    name: string;
    description?: string;
    price?: number;
    priceType?: 'monthly' | 'one-time' | 'per-unit';
}

export interface Contract {
    id: number;
    user_id: number;
    proposal_id?: number;
    template_id?: number;

    // Client Details
    client_name: string;
    client_company?: string;
    client_email?: string;
    client_address?: string;

    // Contract Content
    title: string;
    content: string; // Final content with placeholders filled

    // Deliverables
    deliverables: ContractDeliverable[];
    total_value?: number;
    contract_term?: string;

    // Access
    access_token?: string;

    // Status
    status: 'draft' | 'sent' | 'viewed' | 'signed' | 'countersigned' | 'completed' | 'cancelled';

    // Signatures
    client_signed_at?: string;
    user_signed_at?: string;

    sent_at?: string;
    expires_at?: string;
    created_at: string;
    updated_at: string;

    // Joined data
    signatures?: ContractSignature[];
    template?: ContractTemplate;
}

export interface ContractSignature {
    id: number;
    contract_id: number;
    signer_type: 'client' | 'user';
    signer_name: string;
    signer_email?: string;
    signature_data: string; // Base64 PNG
    ip_address?: string;
    user_agent?: string;
    signed_at: string;
}

export interface CreateContractTemplateRequest {
    name: string;
    description?: string;
    content: string;
    placeholders?: ContractPlaceholder[];
    category?: string;
    is_default?: boolean;
}

export interface CreateContractRequest {
    proposal_id?: number;
    template_id?: number;
    client_name: string;
    client_company?: string;
    client_email?: string;
    client_address?: string;
    title: string;
    content: string;
    deliverables?: ContractDeliverable[];
    total_value?: number;
    contract_term?: string;
    expires_at?: string;
}

export interface SignContractRequest {
    signer_name: string;
    signer_email?: string;
    signature_data: string; // Base64 PNG from signature pad
}
