import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import logoIcon from '../../assets/gams-favicon.svg'

const Login = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Route guard
    useEffect(() => {
        const user = localStorage.getItem('user')
        const token = localStorage.getItem('token')
        
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
                
                localStorage.setItem('user', JSON.stringify(response.data.user))
                
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token)
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
        <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center px-4 py-10 overflow-x-hidden">
            
            <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center min-w-0">
                
                <div className="text-center flex flex-col items-center space-y-4 min-w-0">
                    <div className="w-32 h-32 md:w-32 md:h-32 flex items-center justify-center">
                        <img 
                            src={logoIcon}
                            alt="GAMS Logo" 
                            className="w-full h-full object-contain drop-shadow-md"
                        />
                    </div>

                    <div className="space-y-1">
                        <h1 className="text-5xl md:text-6xl font-bold text-blue-600 tracking-tighter">
                            GAMS
                        </h1>
                        <h2 className="text-xl md:text-2xl text-gray-700 font-medium leading-tight max-w-sm">
                            Gym Admission Management System
                        </h2>
                    </div>
                </div>

                <div className="flex flex-col items-center w-full min-w-0">
                    <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl w-full max-w-400px border border-gray-100 transition-all">
                        
                        <form onSubmit={handleLogin} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm border border-red-100 text-center animate-shake">
                                    {error}
                                </div>
                            )}

                            <div>
                                <input 
                                    type="email" 
                                    required 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg placeholder-gray-400 transition-shadow"
                                    placeholder="Email or Phone Number"
                                />
                            </div>

                            <div>
                                <input 
                                    type="password" 
                                    required 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg placeholder-gray-400 transition-shadow"
                                    placeholder="Password"
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="cursor-pointer w-full bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold py-3.5 rounded-lg text-xl transition-all shadow-md active:scale-95 disabled:bg-blue-300 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Logging In...' : 'Log In'}
                            </button>
                        </form>

                        <div className="border-b border-gray-200 my-6"></div>

                        <div className="text-center">
                            <button 
                                type="button"
                                className="cursor-pointer bg-[#42b72a] hover:bg-[#36a420] text-white font-bold py-3 px-6 rounded-lg text-lg transition-all shadow-md active:scale-95"
                                onClick={() => alert("Contact Administrator to create a new account.")}
                            >
                                Create new account
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Login