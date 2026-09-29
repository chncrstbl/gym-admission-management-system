// ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import GlobalQRScanner from '../../components/GlobalQRScanner'

const ProtectedRoute = ({ allowedUserType }) => {
    const storedUser = localStorage.getItem('user');

    if (!storedUser || storedUser === 'undefined' || storedUser === 'null') {
        return <Navigate to="/" replace />
    }

    let user;
    try {
        user = JSON.parse(storedUser);
    } catch {
        return <Navigate to="/" replace />;
    }

    if (!user?.id) {
        return <Navigate to="/" replace />;
    }

    const userType = localStorage.getItem('userType') || user.role || 'admin';
    const userHome = userType === 'member' ? '/member/dashboard' : '/home';
    if (allowedUserType && userType !== allowedUserType) {
        return <Navigate to={userHome} replace />;
    }
    
    return (
        <>
            <Outlet />
            {userType === 'admin' && <GlobalQRScanner />}
        </>
    )
}

export default ProtectedRoute