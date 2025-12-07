// Invoice Types

export interface InvoiceLineItem {
    id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

export interface Invoice {
    id: number;
    user_id: number;
    proposal_id?: number;

    // Client Details
    client_name: string;
    client_company?: string;
    client_email?: string;
    client_address?: string;

    // Invoice Details
    invoice_number: string;
    title: string;
    line_items: InvoiceLineItem[];
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    currency: string;
    notes?: string;

    // Payment Terms
    due_date?: string;
    payment_terms: 'net_30' | 'net_15' | 'due_on_receipt';
    milestone_number: number;
    milestone_total: number;

    // Payment Integration
    payment_link?: string;
    payment_platform?: string;
    amount_paid?: number;
    balance_due?: number;

    // Status
    status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

    paid_at?: string;
    sent_at?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateInvoiceRequest {
    proposal_id?: number;
    client_name: string;
    client_company?: string;
    client_email?: string;
    client_address?: string;
    title: string;
    line_items: InvoiceLineItem[];
    tax_rate?: number;
    due_date?: string;
    payment_terms?: 'net_30' | 'net_15' | 'due_on_receipt';
    milestone_number?: number;
    milestone_total?: number;
    notes?: string;
}

export interface UpdateInvoiceRequest extends Partial<CreateInvoiceRequest> {
    status?: Invoice['status'];
}
