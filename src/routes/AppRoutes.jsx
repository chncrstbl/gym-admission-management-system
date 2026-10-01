import { Routes, Route } from "react-router-dom"
import Login from "../pages/auth/Login"
import NotFound from "../pages/NotFound"

// Admin Portal
import Home from "../pages/dashboard/Home"
import Overview from "../pages/dashboard/Overview"
import Members from "../pages/dashboard/Members"
import Billing from "../pages/dashboard/Finance"
import Equipment from "../pages/dashboard/Equipment"

import ProtectedRoute from "../pages/auth/ProtectedRoute"

// Member Portal
import MemberDashboard from "../pages/member/MDashboard"
import MemberProfile from "../pages/member/MProfile"
import MemberMembership from "../pages/member/MMembership"
import MemberVisits from "../pages/member/MVisits"
import MemberProgress from "../pages/member/MProgress"
import MemberSettings from "../pages/member/MSettings"

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            
            {/* Admin Portal */}
            <Route element={<ProtectedRoute allowedUserType="admin" />}>
                <Route path="/home" element={<Home />} />
                <Route path="/overview" element={<Overview />} />
                <Route path="/members" element={<Members />} />
                <Route path="/finance" element={<Billing />} />
                <Route path="/equipment" element={<Equipment />} />

            </Route>

            {/* Member Portal */}
            <Route element={<ProtectedRoute allowedUserType="member" />}>
                <Route path="/member/dashboard" element={<MemberDashboard />} />
                <Route path="/member/profile" element={<MemberProfile />} />
                <Route path="/member/membership" element={<MemberMembership />} />
                <Route path="/member/visits" element={<MemberVisits />} />
                <Route path="/member/progress" element={<MemberProgress />} />
                <Route path="/member/settings" element={<MemberSettings />} />
            </Route>

            {/* Fallback Not Found Route */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default AppRoutes