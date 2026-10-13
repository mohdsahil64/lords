import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import loginBg from '../assets/login-bg.webp'
import logo from '../assets/logo.png'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!identifier || !password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post('/api/auth/login', { identifier, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center px-4 py-8 relative"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content wrapper */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">

        {/* Logo */}
        <div className="bg-white rounded-2xl shadow-xl p-2 mb-4 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center flex-shrink-0">
          <img src={logo} alt="Lords University" className="w-full h-full object-contain" />
        </div>

        {/* Welcome Text */}
        <p
          className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase mb-1"
          style={{ color: '#FFA500', textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}
        >
          WELCOME TO
        </p>
        <h1
          className="text-2xl sm:text-4xl font-bold mb-5 text-center"
          style={{ color: '#FFA500', textShadow: '2px 2px 6px rgba(0,0,0,0.5)', fontFamily: 'Georgia, serif' }}
        >
          Lords University
        </h1>

        {/* Main Card */}
        <div
          className="w-full rounded-2xl p-5 sm:p-7"
          style={{ background: 'rgba(15, 20, 35, 0.88)', backdropFilter: 'blur(10px)' }}
        >
          <h2 className="text-white text-base font-semibold mb-4">Sign in here</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Identifier */}
            <input
              type="text"
              placeholder="Registration id/email/phone no."
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-white rounded-xl px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-400 transition"
              autoComplete="username"
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white rounded-xl px-4 py-3 pr-12 text-sm text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-orange-400 transition"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <span className="text-red-500 text-base leading-none">✕</span>
                <span className="text-red-600 text-xs font-medium">{error}</span>
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm tracking-wide transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(90deg, #f06060, #e03535)',
                boxShadow: '0 4px 15px rgba(224, 53, 53, 0.4)'
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Google Sign In */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/40 text-xs">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm font-medium">Sign in with</span>
              <button
                type="button"
                className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                title="Sign in with Google"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                  <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 19.000 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                </svg>
              </button>
            </div>

            {/* Footer links */}
            <div className="flex justify-between pt-2 border-t border-white/10">
              <a
                href="https://lords.digiicampus.com/V2/#/forgotPassword"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 text-xs hover:text-white transition"
              >
                Forgot password?
              </a>
              <a
                href="https://lords.digiicampus.com/V2/#/helpCenter"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 text-xs hover:text-white transition"
              >
                Need assistance? Get Help Here
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
