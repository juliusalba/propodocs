import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingFallback } from '../App';

export function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            const errorParam = searchParams.get('error');

            if (errorParam) {
                setError('Authentication failed. Please try again.');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            if (token) {
                try {
                    // Manually set token and reload
                    localStorage.setItem('auth_token', token);
                    window.location.href = '/dashboard';
                } catch (err) {
                    console.error('Auth callback error', err);
                    setError('Failed to process login token.');
                    setTimeout(() => navigate('/login'), 3000);
                }
            } else {
                navigate('/login');
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAF3CD] text-[#8C0000] font-bold">
                {error}
            </div>
        );
    }

    return <LoadingFallback />;
}
