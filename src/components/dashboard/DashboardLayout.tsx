import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';


export function DashboardLayout({
    children,
    fullScreen = false,
    disablePadding = false
}: {
    children: ReactNode;
    fullScreen?: boolean;
    disablePadding?: boolean;
}) {
    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {!fullScreen && <TopBar />}
                <main className={`flex-1 ${fullScreen ? 'h-full' : (disablePadding ? 'overflow-y-auto' : 'p-8 overflow-y-auto')}`}>
                    <div className={fullScreen || disablePadding ? 'h-full' : 'max-w-7xl mx-auto'}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
