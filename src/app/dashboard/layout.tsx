import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen relative"
                style={{ borderLeft: '3px solid #1a1a1a' }}
            >
                {children}
            </main>
        </div>
    );
}
