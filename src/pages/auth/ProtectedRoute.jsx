// ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom'
import GlobalQRScanner from '../../components/GlobalQRScanner'

const ProtectedRoute = () => {
    const user = localStorage.getItem('user')

    if (!user) {
        return <Navigate to="/" replace />
    }
    
    return (
        <>
            <Outlet />
            <GlobalQRScanner />
        </>
    )
}

export default ProtectedRoute