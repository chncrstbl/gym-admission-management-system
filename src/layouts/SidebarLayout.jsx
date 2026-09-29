// src/components/layout/SidebarLayout.jsx
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";

const SidebarLayout = ({
    bannerImage,
    logo,
    navItems = [],
    onClose,
    onSignOut,
    signOutLabel = "Sign Out",
    header,
    footer,
    children
}) => {
    const linkStyle = "p-2 rounded-lg transition-colors flex items-center gap-3 font-medium text-sm";
    const activeStyle = "bg-blue-600 text-white shadow-lg";
    const inactiveStyle = "text-slate-400 hover:text-white hover:bg-slate-800";

    return (
        <aside className="h-full w-full bg-slate-900 text-white shadow-2xl flex flex-col justify-between overflow-y-auto font-sans">
            <div>
                {/* Header Slot or Default Banner */}
                {header ? (
                    header
                ) : (
                    <div 
                        className="relative h-32 w-full bg-cover bg-center mb-12" 
                        style={{ backgroundImage: bannerImage ? `url(${bannerImage})` : undefined }}
                    >
                        {logo && (
                            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                                <div className="bg-slate-900 rounded-full">
                                    <img 
                                        src={logo} 
                                        alt="Portal Logo"
                                        className="h-24 w-24 rounded-full object-cover border-4 border-slate-900"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Navigation Menu */}
                <nav className="flex flex-col space-y-2 px-6">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink 
                                key={item.to}
                                to={item.to} 
                                onClick={onClose} 
                                className={({ isActive }) => `${linkStyle} ${isActive ? activeStyle : inactiveStyle}`}
                            >
                                {Icon && <Icon size={20} />}
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                    {children}
                </nav>
            </div>

            {/* Footer Slot or Default Sign Out Button */}
            {footer ? (
                footer
            ) : (
                onSignOut && (
                    <div className="border-t border-slate-800 p-6">
                        <button 
                            type="button"
                            onClick={onSignOut}
                            className="cursor-pointer w-full flex items-center gap-3 p-2 rounded-lg text-slate-400 hover:bg-red-900/50 hover:text-red-200 transition-colors group"
                        >
                            <LogOut size={20} className="group-hover:text-red-400" />
                            <span className="font-medium text-sm">{signOutLabel}</span>
                        </button>
                    </div>
                )
            )}
        </aside>
    );
};

export default SidebarLayout;