// src/layouts/PageLayout.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import MemberSidebar from "../components/MemberSidebar";
import Header from "../components/Header";
import SignOutModal from "../components/Modals/SignOutModal";

const PageLayout = ({ title, sidebar, children }) => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSignOutOpen, setIsSignOutOpen] = useState(false);

    const userType = localStorage.getItem('userType');
    const SidebarComponent = sidebar || (userType === 'member' ? MemberSidebar : AdminSidebar);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        setIsSignOutOpen(false);
        navigate("/", { replace: true });
    };

    return (
        <div className="app-shell flex min-h-screen font-sans">
            {/* Mobile Header Bar */}
            <div className="mobile-header fixed top-0 left-0 right-0 z-30 p-4 flex items-center justify-between md:hidden">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsSidebarOpen(true)} 
                        className="cursor-pointer p-2 -ml-2 hover:bg-gray-100 rounded-md text-gray-700"
                    >
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg text-slate-900 truncate">{title}</span>
                </div>
            </div>

            {/* Sidebar Drawer Container */}
            <aside className={`
                app-sidebar fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 
            `}>
                <div className="h-full relative">
                    <SidebarComponent 
                        onClose={() => setIsSidebarOpen(false)} 
                        onSignOut={() => setIsSignOutOpen(true)} 
                    />
                    <button 
                        onClick={() => setIsSidebarOpen(false)} 
                        className="absolute top-4 right-4 text-slate-400 md:hidden hover:text-red-400 p-1"
                    >
                        <X size={24} />
                    </button>
                </div>
            </aside>

            {/* Mobile Drawer Overlay Backdrop */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden" 
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Viewport Content Area */}
            <div className="app-content flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 md:ml-64 mt-16 md:mt-0">
                {userType !== 'member' && (
                    <div className="hidden md:block">
                        <Header title={title}/>
                    </div>
                )}
                <main className="app-main flex-1 p-4 md:p-6">
                    {children}
                </main>
            </div>

            {/* Sign Out Confirmation Modal */}
            <SignOutModal 
                isOpen={isSignOutOpen} 
                onClose={() => setIsSignOutOpen(false)} 
                onConfirm={handleLogout} 
            />
        </div>
    );
};

export default PageLayout;