import { NavLink } from "react-router-dom"
import logoIcon from '../assets/gams-favicon.svg'
import sidebarImage from '../assets/gams-sidebar3.png'
// 1. Import your new Lucide icons
import { Home, BarChart2, Users, Dumbbell, Wallet, LogOut } from 'lucide-react';

const Sidebar = ({ onClose, onSignOut }) => {
    
    const linkStyle = "p-2 rounded-lg transition-colors flex items-center gap-3 font-medium"
    const activeStyle = "bg-blue-600 text-white shadow-lg"
    const inactiveStyle = "text-slate-400 hover:text-white hover:bg-slate-800"

    return (
        <aside className="h-full w-full bg-slate-900 text-white shadow-2xl flex flex-col justify-between overflow-y-auto">
            
            <div>
                <div className="relative h-32 w-full bg-cover bg-center mb-12" style={{ backgroundImage: `url(${sidebarImage})` }}>
                    <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                        <div className="bg-slate-900 rounded-full">
                            <img 
                                src={logoIcon} 
                                alt="Company Logo"
                                className="h-24 w-24 rounded-full object-cover border-4 border-slate-900"
                            />
                        </div>
                    </div>
                </div>
                
                <nav className="flex flex-col space-y-2 px-6">
                    {/* 2. Replaced SVGs with clean Lucide components */}
                    <NavLink to="/home" onClick={onClose} className={({isActive}) => `${linkStyle} ${isActive ? activeStyle : inactiveStyle}` }>
                        <Home size={20} />
                        Home
                    </NavLink>
                    <NavLink to="/overview" onClick={onClose} className={({isActive}) => `${linkStyle} ${isActive ? activeStyle : inactiveStyle}` }>
                        <BarChart2 size={20} />
                        Overview
                    </NavLink>
                    <NavLink to="/members" onClick={onClose} className={({isActive}) => `${linkStyle} ${isActive ? activeStyle : inactiveStyle}` }>
                        <Users size={20} />
                        Members
                    </NavLink>
                    <NavLink to="/equipment" onClick={onClose} className={({isActive}) => `${linkStyle} ${isActive ? activeStyle : inactiveStyle}` }>
                        <Dumbbell size={20} />
                        Inventory
                    </NavLink>
                    <NavLink to="/finance" onClick={onClose} className={({isActive}) => `${linkStyle} ${isActive ? activeStyle : inactiveStyle}` }>
                        <Wallet size={20} />
                        Finance
                    </NavLink>
                </nav>
            </div>

            <div className="border-t border-slate-800 p-6">
                <button 
                    onClick={onSignOut}
                    className="cursor-pointer w-full flex items-center gap-3 p-2 rounded-lg text-slate-400 hover:bg-red-900/50 hover:text-red-200 transition-colors group"
                >
                    <LogOut size={20} className="group-hover:text-red-400" />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    )
}

export default Sidebar