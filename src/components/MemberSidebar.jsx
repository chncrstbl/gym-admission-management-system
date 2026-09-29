// src/components/member/MemberSidebar.jsx
import SidebarLayout from "../layouts/SidebarLayout";
import logoIcon from "../assets/gams-favicon.svg";
import sidebarImage from "../assets/gams-sidebar3.png";

import { 
    LayoutDashboard, 
    User, 
    CreditCard, 
    QrCode, 
    TrendingUp, 
    Settings 
} from "lucide-react";

const MemberSidebar = ({ onClose, onSignOut }) => {
    const memberNavItems = [
        { to: "/member/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/member/profile", label: "Profile", icon: User },
        { to: "/member/membership", label: "Membership", icon: CreditCard },
        { to: "/member/visits", label: "Check-In & Visits", icon: QrCode },
        { to: "/member/progress", label: "Fitness Progress", icon: TrendingUp },
        { to: "/member/settings", label: "Settings", icon: Settings },
    ];

    return (
        <SidebarLayout
            bannerImage={sidebarImage}
            logo={logoIcon}
            navItems={memberNavItems}
            onClose={onClose}
            onSignOut={onSignOut}
            signOutLabel="Sign Out"
        />
    );
};

export default MemberSidebar;