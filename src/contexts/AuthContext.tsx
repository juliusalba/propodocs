import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../lib/api';

interface UserProfile {
    id: number;
    email: string;
    name: string;
    company?: string;
    role?: 'user' | 'admin';
    signature_url?: string;
    logo_url?: string;
    avatar_url?: string;
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { email: string; password: string; name: string; company?: string }) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in (token exists)
        const initializeAuth = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    // Verify token by fetching current user
                    const data = await api.getCurrentUser();
                    setUser(data.user);
                }
            } catch (error) {
                // Silently handle auth errors - server may be unavailable or token invalid
                localStorage.removeItem('auth_token');
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for unauthorized events (401) from API
        const handleUnauthorized = () => {
            localStorage.removeItem('auth_token');
            setUser(null);
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, []);

    const login = async (email: string, password: string) => {
        const data = await api.login({ email, password });
        setUser(data.user);
    };

    const register = async (data: { email: string; password: string; name: string; company?: string }) => {
        const result = await api.register(data);
        setUser(result.user);
    };

    const logout = async () => {
        // Try to logout from server, but don't fail if it errors
        await api.logout().catch(() => { });
        api.clearToken();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
