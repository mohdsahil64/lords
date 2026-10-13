import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import logo from '../assets/logo.png'

export default function Verify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Invalid QR code. No token found.')
      setLoading(false)
      return
    }
    axios.get(`/api/verify/qr?token=${encodeURIComponent(token)}`)
      .then(res => { setData(res.data); setLoading(false) })
      .catch(err => {
        setError(err.response?.data?.message || 'Invalid or expired QR code.')
        setLoading(false)
      })
  }, [token])

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#8B1A1A] rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Verifying QR Code…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-2xl">✕</span>
            </div>
            <p className="text-red-500 font-semibold text-center text-sm">{error}</p>
            <button onClick={() => navigate('/login')} className="text-sm text-blue-600 hover:underline">
              Go to Login
            </button>
          </div>
        )}

        {/* Success */}
        {!loading && !error && data && (
          <>
            {/* University Header */}
            <div className="text-center mb-5">
              <h1
                className="text-3xl font-black leading-tight tracking-widest"
                style={{ color: '#5C1A1A', fontFamily: 'Georgia, serif' }}
              >
                LORDS
              </h1>
              <h2
                className="text-xl font-bold tracking-widest"
                style={{ color: '#5C1A1A', fontFamily: 'Georgia, serif' }}
              >
                UNIVERSITY
              </h2>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 mb-5" />

            {/* Subtitle */}
            <div className="text-center mb-5">
              <p className="text-gray-800 font-semibold text-sm">Lords University</p>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                Alwar-Bhiwadi Highway, Chikani, Alwar,<br />
                Rajasthan, India - 301028.
              </p>
              <p className="text-red-500 font-semibold text-sm mt-4">
                Degree Certificate for QR Code Verification
              </p>
            </div>

            {/* Student Photo — large round, left-aligned like photo 4 */}
            <div className="mb-6 pl-1">
              {data.photoUrl ? (
                <img
                  src={data.photoUrl}
                  alt={data.name}
                  className="w-20 h-20 rounded-full object-cover object-top border-2 border-gray-300 shadow"
                  onError={(e) => {
                    // fallback to initials if photo fails to load
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              {/* Fallback initials circle */}
              <div
                className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-300 shadow"
                style={{ display: data.photoUrl ? 'none' : 'flex' }}
              >
                <span className="text-blue-600 font-bold text-2xl">
                  {data.name?.[0] || 'S'}
                </span>
              </div>
            </div>

            {/* Details list — exactly like photo 4 */}
            <div className="space-y-3 text-sm">
              <DetailRow label="Name"            value={data.name}           isBlue />
              <DetailRow label="Registration Id" value={data.registrationId} />
              <DetailRow label="Programme"       value={data.programme}      />
              <DetailRow label="Department"      value={data.department}     />
              <DetailRow label="Batch Year"      value={String(data.batchYear)} />
              <DetailRow label="Issued On"       value={formatDate(data.issuedOn)} />
            </div>

            {/* Permission note */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 italic text-center leading-relaxed">
                You don't have permission to view certificate,{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-red-500 hover:underline not-italic font-medium"
                >
                  click here
                </button>
                {' '}to login
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value, isBlue }) {
  return (
    <div className="flex gap-2">
      <span className="font-bold text-gray-800 min-w-[130px] shrink-0">{label} :</span>
      <span className={isBlue ? 'text-blue-600 font-medium' : 'text-gray-700'}>
        {value || '-'}
      </span>
    </div>
  )
}
