import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Banner from "../components/Banner";
import SignOutModal from "../components/Modals/SignOutModal";

const HomeLayout = ({ title, children }) => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const [isSignOutOpen, setIsSignOutOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setIsSignOutOpen(false);
        navigate("/");
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            <div className="fixed top-0 left-0 right-0 z-30 bg-white shadow-sm p-4 flex items-center justify-between md:hidden">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsSidebarOpen(true)} className="cursor-pointer p-2 -ml-2 hover:bg-gray-100 rounded-md text-gray-700">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-lg text-gray-800 truncate">{title}</span>
                </div>
            </div>

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 
            `}>
                <div className="h-full relative">
                    <Sidebar 
                        onClose={() => setIsSidebarOpen(false)} 
                        onSignOut={() => setIsSignOutOpen(true)}
                    />
                    <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 text-gray-500 md:hidden hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>
            </aside>

            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}/>
            )}

            <div className="flex-1 flex flex-col transition-all duration-300 ml-0 md:ml-64 mt-16 md:mt-0">
                <div className="hidden md:block">
                    <Banner title={title}/>
                </div>
                <main className="flex-1 bg-gray-50">
                    {children}
                </main>
            </div>

            <SignOutModal 
                isOpen={isSignOutOpen} 
                onClose={() => setIsSignOutOpen(false)} 
                onConfirm={handleLogout} 
            />
        </div>
    );
};

export default HomeLayout;