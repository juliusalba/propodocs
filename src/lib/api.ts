import { cache } from './cache';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class APIClient {
    private token: string | null = null;

    constructor() {
        // Load token from localStorage
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token: string) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
        // Clear all caches on logout
        cache.clear();
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            if (response.status === 401) {
                this.clearToken();
                window.dispatchEvent(new Event('auth:unauthorized'));
                throw new Error('Session expired. Please login again.');
            }
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    }
    // Generic HTTP methods
    async get(endpoint: string) {
        return this.request(endpoint);
    }

    async post(endpoint: string, data: any) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint: string, data: any) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint: string) {
        return this.request(endpoint, { method: 'DELETE' });
    }
    // Auth
    async register(data: { email: string; password: string; name: string; company?: string }) {
        const result = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.setToken(result.token);
        return result;
    }

    async login(data: { email: string; password: string }) {
        const result = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.setToken(result.token);
        return result;
    }

    async logout() {
        await this.request('/auth/logout', { method: 'POST' });
        this.clearToken();
    }

    async getCurrentUser() {
        // Cache user profile for 5 minutes (fast repeat visits)
        return cache.getOrFetch(
            'user:profile',
            () => this.request('/auth/me'),
            { ttl: 5 * 60 * 1000, useMemory: true, usePersistent: true }
        );
    }

    async updateProfile(data: {
        name?: string;
        company?: string;
        signature_url?: string;
        logo_url?: string;
        avatar_url?: string;
    }) {
        const result = await this.request('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        // Invalidate user cache after update
        cache.invalidate('user:profile');
        return result;
    }

    // Proposals
    async createProposal(data: any) {
        return this.request('/proposals', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getProposals(params?: { trashed?: boolean }) {
        const query = params?.trashed ? '?trashed=true' : '';
        const cacheKey = `proposals:list${query}`;

        // Cache proposals list for 2 minutes
        return cache.getOrFetch(
            cacheKey,
            () => this.request(`/proposals${query}`),
            { ttl: 2 * 60 * 1000, useMemory: true, usePersistent: false }
        );
    }

    async getProposal(id: number) {
        return this.request(`/proposals/${id}`);
    }

    async updateProposal(id: number, data: any) {
        return this.request(`/proposals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteProposal(id: number, force = false) {
        const query = force ? '?force=true' : '';
        return this.request(`/proposals/${id}${query}`, { method: 'DELETE' });
    }

    async getProposalVersion(proposalId: number, versionId: number) {
        return this.request(`/proposals/${proposalId}/versions/${versionId}`);
    }

    async restoreProposal(id: number) {
        return this.request(`/proposals/${id}/restore`, { method: 'POST' });
    }

    async acceptProposal(id: number, token?: string) {
        return this.request(`/proposals/${id}/accept`, {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }

    async rejectProposal(id: number, reason?: string) {
        return this.request(`/proposals/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason }),
        });
    }

    async addComment(proposalId: number, data: any) {
        return this.request(`/proposals/${proposalId}/comments`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getComments(proposalId: number) {
        return this.request(`/proposals/${proposalId}/comments`);
    }

    async sendProposalEmail(proposalId: number, data: { email: string; link: string; message?: string }) {
        return this.request(`/proposals/${proposalId}/share-email`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async resolveComment(proposalId: number, commentId: number, isResolved = true) {
        return this.request(`/proposals/${proposalId}/comments/${commentId}/resolve`, {
            method: 'PATCH',
            body: JSON.stringify({ is_resolved: isResolved }),
        });
    }

    async getBlockComments(proposalId: number, blockId: string) {
        return this.request(`/proposals/${proposalId}/comments/block/${blockId}`);
    }

    async trackBlockChange(proposalId: number, blockId: string, data: any) {
        return this.request(`/proposals/${proposalId}/blocks/${blockId}/changes`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getBlockChanges(proposalId: number, blockId: string) {
        return this.request(`/proposals/${proposalId}/blocks/${blockId}/changes`);
    }

    // Links
    async createLink(proposalId: number, data: any) {
        return this.request(`/links/${proposalId}/links`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getLinks(proposalId: number) {
        return this.request(`/links/${proposalId}/links`);
    }

    async updateLink(linkId: number, data: any) {
        return this.request(`/links/${linkId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async revokeLink(linkId: number) {
        return this.request(`/links/${linkId}`, { method: 'DELETE' });
    }

    async getProposalByToken(token: string, password?: string) {
        const query = password ? `?password=${encodeURIComponent(password)}` : '';
        return fetch(`${API_BASE_URL}/links/share/${token}${query}`).then(r => r.json());
    }

    // Analytics
    async trackView(data: any) {
        return fetch(`${API_BASE_URL}/analytics/views`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(r => r.json());
    }

    async updateViewDuration(viewId: number, durationSeconds: number) {
        return fetch(`${API_BASE_URL}/analytics/views/${viewId}/duration`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ durationSeconds }),
        }).then(r => r.json());
    }

    async trackInteraction(data: any) {
        return fetch(`${API_BASE_URL}/analytics/interactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }).then(r => r.json());
    }

    async getAnalytics(proposalId: number) {
        return this.request(`/analytics/proposals/${proposalId}/analytics`);
    }

    async getSessions(proposalId: number) {
        return this.request(`/analytics/proposals/${proposalId}/sessions`);
    }

    async getPipelineStats() {
        return this.request('/analytics/pipeline');
    }

    async getSessionInteractions(sessionId: string) {
        return this.request(`/analytics/sessions/${sessionId}/interactions`);
    }

    // AI
    async generateProposal(data: any) {
        return this.request('/ai/generate-proposal', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async enhanceContent(content: string, instruction?: string) {
        return this.request('/ai/enhance-content', {
            method: 'POST',
            body: JSON.stringify({ content, instruction }),
        });
    }

    // Upload
    async uploadFile(data: FormData) {
        const token = this.token;
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: data,
        });

        if (!response.ok) {
            if (response.status === 401) {
                this.clearToken();
                window.dispatchEvent(new Event('auth:unauthorized'));
                throw new Error('Session expired. Please login again.');
            }
            const error = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error.error || 'Upload failed');
        }

        return response.json();
    }

    async uploadAudio(data: FormData) {
        const token = this.token;
        // Using /uploads/audio endpoint
        const response = await fetch(`${API_BASE_URL}/uploads/audio`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: data,
        });

        if (!response.ok) {
            if (response.status === 401) {
                this.clearToken();
                window.dispatchEvent(new Event('auth:unauthorized'));
                throw new Error('Session expired. Please login again.');
            }
            const error = await response.json().catch(() => ({ error: 'Audio upload failed' }));
            throw new Error(error.error || 'Audio upload failed');
        }

        return response.json();
    }

    // Templates
    async createTemplate(data: any) {
        return this.request('/templates', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getTemplates() {
        return this.request('/templates');
    }

    async getTemplate(id: number) {
        return this.request(`/templates/${id}`);
    }

    async updateTemplate(id: number, data: any) {
        return this.request(`/templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteTemplate(id: number) {
        return this.request(`/templates/${id}`, { method: 'DELETE' });
    }

    // Calculators
    async getCalculators() {
        return this.request('/calculators');
    }

    async getCalculator(id: string) {
        return this.request(`/calculators/${id}`);
    }

    async createCalculator(data: any) {
        return this.request('/calculators', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateCalculator(id: string, data: any) {
        return this.request(`/calculators/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteCalculator(id: string) {
        return this.request(`/calculators/${id}`, { method: 'DELETE' });
    }

    async generateCalculatorSchema(prompt: string) {
        return this.request('/calculators/generate', {
            method: 'POST',
            body: JSON.stringify({ prompt }),
        });
    }

    async generateCustomPDF(data: any) {
        const token = this.token;
        const response = await fetch(`${API_BASE_URL}/pdf/generate-custom-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`PDF generation failed: ${error}`);
        }

        return response.blob();
    }

    async editCalculatorBlock(data: {
        blockType: 'tier' | 'addon' | 'column' | 'section' | 'header';
        blockData: any;
        instruction: string;
        fullSchema?: any;
    }) {
        return this.request('/calculators/edit-block', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // ======================
    // INVOICES
    // ======================

    async getInvoices(filters?: { status?: string; proposalId?: number }) {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.proposalId) params.append('proposalId', filters.proposalId.toString());
        return this.request(`/invoices?${params.toString()}`);
    }

    async getInvoice(id: number) {
        return this.request(`/invoices/${id}`);
    }

    async createInvoice(data: any) {
        return this.request('/invoices', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateInvoice(id: number, data: any) {
        return this.request(`/invoices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteInvoice(id: number) {
        return this.request(`/invoices/${id}`, { method: 'DELETE' });
    }

    async sendInvoice(id: number) {
        return this.request(`/invoices/${id}/send`, { method: 'POST' });
    }

    async updateInvoiceStatus(id: number, status: string) {
        return this.request(`/invoices/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    async generateInvoiceFromProposal(proposalId: number, options?: { milestones?: number }) {
        return this.request(`/invoices/from-proposal/${proposalId}`, {
            method: 'POST',
            body: JSON.stringify(options || {}),
        });
    }

    async generateInvoicePdf(id: number) {
        const token = this.token;
        const response = await fetch(`${API_BASE_URL}/invoices/${id}/pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
        });
        if (!response.ok) throw new Error('Failed to generate invoice PDF');
        return response.blob();
    }

    // ======================
    // CONTRACTS
    // ======================

    async getContracts(filters?: { status?: string; proposalId?: number }) {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.proposalId) params.append('proposalId', filters.proposalId.toString());
        return this.request(`/contracts?${params.toString()}`);
    }

    async getContract(id: number) {
        return this.request(`/contracts/${id}`);
    }

    async getContractByToken(token: string) {
        return this.request(`/contracts/view/${token}`);
    }

    async createContract(data: any) {
        return this.request('/contracts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateContract(id: number, data: any) {
        return this.request(`/contracts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteContract(id: number) {
        return this.request(`/contracts/${id}`, { method: 'DELETE' });
    }

    async sendContract(id: number) {
        return this.request(`/contracts/${id}/send`, { method: 'POST' });
    }

    async signContract(token: string, data: { signer_name: string; signer_email?: string; signature_data: string }) {
        return this.request(`/contracts/sign/${token}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async countersignContract(id: number, data: { signature_data: string }) {
        return this.request(`/contracts/${id}/countersign`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async generateContractFromProposal(proposalId: number, templateId?: number) {
        return this.request(`/contracts/from-proposal/${proposalId}`, {
            method: 'POST',
            body: JSON.stringify({ templateId }),
        });
    }

    async generateContractPdf(id: number) {
        const token = this.token;
        const response = await fetch(`${API_BASE_URL}/contracts/${id}/pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
        });
        if (!response.ok) throw new Error('Failed to generate contract PDF');
        return response.blob();
    }

    // ======================
    // CONTRACT TEMPLATES
    // ======================

    async getContractTemplates() {
        return this.request('/contract-templates');
    }

    async getContractTemplate(id: number) {
        return this.request(`/contract-templates/${id}`);
    }

    async createContractTemplate(data: any) {
        return this.request('/contract-templates', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateContractTemplate(id: number, data: any) {
        return this.request(`/contract-templates/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteContractTemplate(id: number) {
        return this.request(`/contract-templates/${id}`, { method: 'DELETE' });
    }

    // ======================
    // VIEWER TRACKING
    // ======================

    async checkViewer(email: string) {
        return this.request('/proposals/check-viewer', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async registerViewer(proposalId: number, data: { email: string; name?: string; company?: string }) {
        // Use fetch directly since this is a public endpoint
        const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/register-viewer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to register viewer');
        return response.json();
    }

    async updateViewSession(sessionId: number, data: { duration_seconds?: number; scroll_depth?: number; sections_viewed?: string[] }) {
        // Use fetch directly since this is a public endpoint
        const response = await fetch(`${API_BASE_URL}/proposals/view-session/${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update session');
        return response.json();
    }

    async getProposalViewers(proposalId: number) {
        return this.request(`/proposals/${proposalId}/viewers`);
    }
}

export const api = new APIClient();
