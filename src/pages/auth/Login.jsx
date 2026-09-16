import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import logoIcon from '../../assets/gams-favicon.svg'

const Login = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Route guard: Check both persistent and temporary storage
    useEffect(() => {
        const user = localStorage.getItem('user') || sessionStorage.getItem('user')
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        
        if (user || token) {
            navigate('/home', { replace: true }) 
        }
    }, [navigate])

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const response = await api.post('/login', { email, password })
            if (response.data.success) {
                
                const storageTarget = rememberMe ? localStorage : sessionStorage
                
                storageTarget.setItem('user', JSON.stringify(response.data.user))
                
                if (response.data.token) {
                    storageTarget.setItem('token', response.data.token)
                }
                
                navigate('/home', { replace: true }) 
            } else {
                setError("Login failed: Server response invalid")
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid email or password.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex flex-col md:flex-row bg-[#f8fafc] font-sans">
            
            {/* Left Panel */}
            <div className="relative w-full md:w-1/2 bg-linear-to-br from-[#041a5f] via-[#01358a] to-[#0078d7] flex flex-col justify-center p-8 md:p-10 lg:p-20 text-white overflow-hidden min-h-[45vh] md:min-h-screen">
                
                {/* Decorative Diagonal Lines */}
                <div 
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{ 
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 15px, rgba(255,255,255,0.05) 15px, rgba(255,255,255,0.05) 16px)' 
                    }}
                ></div>

                {/* Top Left Logo */}
                <div className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center space-x-3 z-10">
                    <div className="bg-white/10 backdrop-blur-sm rounded-full p-1.5 w-10 h-10 flex items-center justify-center">
                        <img 
                            src={logoIcon} 
                            alt="GAMS Logo" 
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="leading-tight flex flex-col justify-center">
                        <span className="block text-xl md:text-2xl font-bold tracking-wider">GAMS</span>
                        <span className="block text-[10px] md:text-xs font-medium tracking-wide text-blue-200">
                            Gym Admission Management System
                        </span>
                    </div>
                </div>

                {/* Center Content */}
                <div className="relative z-10 max-w-lg mt-20 md:mt-0">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 leading-tight tracking-tight">
                        Hello,<br />welcome!
                    </h1>
                    <p className="text-blue-100 mb-2 md:mb-8 max-w-sm text-sm md:text-base leading-relaxed">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus nisi risus.
                    </p>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 relative">
                
                <div className="w-full max-w-130">
                    <form onSubmit={handleLogin} className="space-y-5">
                        
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-100 text-center animate-shake">
                                {error}
                            </div>
                        )}

                        {/* Email Input Structure */}
                        <div className="bg-white flex items-stretch border border-gray-200 rounded-lg overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                            <div className="bg-[#a5c8ff] w-12 shrink-0 flex items-center justify-center m-1.5 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#01358a]" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                            </div>
                            <div className="px-3 py-2 flex-1">
                                <label className="block text-[11px] font-bold text-[#01358a] uppercase tracking-wide">
                                    Email address
                                </label>
                                <input 
                                    type="email" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full outline-none text-sm text-gray-800 bg-transparent font-medium placeholder-gray-400 mt-0.5"
                                    placeholder="name@email.com"
                                />
                            </div>
                        </div>

                        {/* Password Input Structure */}
                        <div className="bg-white flex items-stretch border border-gray-200 rounded-lg overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                            <div className="bg-[#a5c8ff] w-12 shrink-0 flex items-center justify-center m-1.5 rounded-md">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#01358a]" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="px-3 py-2 flex-1">
                                <label className="block text-[11px] font-bold text-[#01358a] uppercase tracking-wide">
                                    Password
                                </label>
                                <input 
                                    type="password" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full outline-none text-sm text-gray-800 bg-transparent font-medium placeholder-gray-400 mt-0.5 tracking-widest"
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>

                        {/* Options */}
                        <div className="flex items-center justify-between text-xs font-bold text-[#01358a] px-1">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded-sm border-2 border-[#01358a] text-[#01358a] focus:ring-[#01358a] cursor-pointer" 
                                />
                                <span>Remember me</span>
                            </label>
                            <button type="button" className="hover:underline hover:text-blue-600 transition-colors"
                                    onClick={() => alert("Contact Administrator to change password.")}>
                                Forgot password?
                            </button>
                        </div>

                        {/* Login Button */}
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="cursor-pointer w-full bg-white border border-gray-100 text-[#01358a] font-bold py-3.5 rounded-lg shadow-[0_4px_14px_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] transition-all active:scale-[0.98] disabled:opacity-70 mt-4"
                        >
                            {isLoading ? 'Logging In...' : 'Login'}
                        </button>
                    </form>

                    {/* Sign Up Section */}
                    <div className="mt-14 flex flex-col items-center space-y-3">
                        <span className="text-xs font-bold text-[#01358a]">
                            Not a member yet?
                        </span>
                        <button 
                            type="button"
                            onClick={() => alert("Contact Administrator to create a new account.")}
                            className="cursor-pointer w-full bg-linear-to-r from-[#00174f] to-[#0078d7] text-white font-bold py-3.5 rounded-lg shadow-[0_4px_14px_rgba(0,120,215,0.3)] hover:opacity-85 transition-all active:scale-[0.98]"
                        >
                            Sign up
                        </button>
                    </div>

                </div>
            </div>
            
        </div>
    )
}

export default Login