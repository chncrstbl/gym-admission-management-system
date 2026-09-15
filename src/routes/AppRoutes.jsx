import { Routes, Route } from "react-router-dom"
import Login from "../pages/auth/Login"
import Home from "../pages/dashboard/Home"
import Overview from "../pages/dashboard/Overview"
import NotFound from "../pages/NotFound"
import Members from "../pages/dashboard/Members"
import Billing from "../pages/dashboard/Finance"
import Equipment from "../pages/dashboard/Equipment"
import ProtectedRoute from "../pages/auth/ProtectedRoute"

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home />} />
                <Route path="/overview" element={<Overview />} />
                <Route path="/members" element={<Members />} />
                <Route path="/finance" element={<Billing />} />
                <Route path="/equipment" element={<Equipment/>} />
                
                <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}

export default AppRoutes