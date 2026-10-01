// src/components/AdminSidebar.jsx
import SidebarLayout from "../layouts/SidebarLayout";
import logoIcon from "../assets/gams-favicon.svg";
import sidebarImage from "../assets/gams-sidebar3.png";
import { Home, BarChart2, Users, Dumbbell, Wallet } from "lucide-react";

const AdminSidebar = ({ onClose, onSignOut }) => {
    const adminNavItems = [
        { to: "/home", label: "Home", icon: Home },
        { to: "/overview", label: "Overview", icon: BarChart2 },
        { to: "/members", label: "Members", icon: Users },
        { to: "/equipment", label: "Inventory", icon: Dumbbell },
        { to: "/finance", label: "Finance", icon: Wallet }
    ];

    return (
        <SidebarLayout
            bannerImage={sidebarImage}
            logo={logoIcon}
            navItems={adminNavItems}
            onClose={onClose}
            onSignOut={onSignOut}
            signOutLabel="Sign Out"
        />
    );
};

export default AdminSidebar;