import { useEffect, useState } from 'react'
import axios from 'axios'
import logo from '../assets/logo.png'

/**
 * Public certificate verification page.
 *
 * Opened by the degree QR code:
 *   https://lords.digiicampus.vercel.app/V2/#/public-certificate?id=<encrypted-id>
 *
 * Flow:
 *   1. Read `id` from the URL (query string that follows the hash route).
 *   2. Try the backend  GET /api/verify/cert?id=...
 *   3. If the backend is unreachable / errors, fall back to the static
 *      /certificates.json bundled with the frontend so the page still works.
 */

// Read ?id= whether it sits in the normal query or after the hash route
// (e.g. ".../V2/#/public-certificate?id=XYZ").
function readIdFromUrl() {
  // Normal query string first
  const direct = new URLSearchParams(window.location.search).get('id')
  if (direct) return direct
  // Then the part after the hash: "#/public-certificate?id=XYZ"
  const hash = window.location.hash || ''
  const qIndex = hash.indexOf('?')
  if (qIndex !== -1) {
    const hp = new URLSearchParams(hash.slice(qIndex + 1)).get('id')
    if (hp) return hp
  }
  return null
}

export default function PublicCertificate() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    const id = readIdFromUrl()
    if (!id) {
      setError('Invalid QR code. No certificate id found.')
      setLoading(false)
      return
    }

    let cancelled = false

    const loadFallback = async () => {
      try {
        // certificates.json lives in the frontend's public/ root. Under the
        // /V2/ base it resolves relative to the deployed base path.
        const base = import.meta.env.BASE_URL || '/'
        const res = await fetch(`${base}certificates.json`, { cache: 'no-store' })
        if (!res.ok) throw new Error('fallback file missing')
        const all = await res.json()
        const record = all[id]
        if (!record) throw new Error('certificate not in fallback')
        if (cancelled) return
        setData({
          name: record.name,
          registrationId: record.registrationId,
          programme: record.programme,
          department: record.department,
          batchYear: record.batchYear,
          issuedOn: record.issuedOn,
          photoUrl: record.photo ? `${base}${record.photo}` : null,
        })
        setLoading(false)
      } catch {
        if (cancelled) return
        setError('This certificate could not be verified.')
        setLoading(false)
      }
    }

    axios.get(`/api/verify/cert?id=${encodeURIComponent(id)}`)
      .then(res => {
        if (cancelled) return
        setData(res.data)
        setLoading(false)
      })
      .catch(() => {
        // Backend down or errored -> try the offline static file.
        if (!cancelled) loadFallback()
      })

    return () => { cancelled = true }
  }, [])

  return <CertificateCard data={data} loading={loading} error={error} />
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const time = d.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
  return `${date}, ${time}`
}

// Build the login URL for the frontend SPA. This page renders on a hash route
// without a Router, so we point straight at "<base>#/login".
const loginUrl = `${import.meta.env.BASE_URL || '/'}#/login`

// Show the short programme name on this page (data still comes from DB/fallback).
const PROGRAMME_SHORT = {
  'bachelor of computer applications': 'BCA',
}
const shortProgramme = (p) => {
  if (!p) return '-'
  return PROGRAMME_SHORT[p.trim().toLowerCase()] || p
}

export function CertificateCard({ data, loading, error }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

        {loading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-[#8B1A1A] rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Verifying QR Code…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-500 text-2xl">✕</span>
            </div>
            <p className="text-red-500 font-semibold text-center text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* University logo header */}
            <div className="flex justify-center mb-11">
              <img src={logo} alt="Lords University" className="h-16 w-auto object-contain" />
            </div>

            {/* University name + address + title */}
            <div className="text-center mb-5">
              <p className="text-gray-800 font-bold text-sm">Lords University</p>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                Alwar-Bhiwadi Highway, Chikani, Alwar,<br />
                Rajasthan, India - 301028.
              </p>
              <p className="text-red-500 font-bold text-sm mt-3 leading-snug">
                Degree Certificate for QR Code<br />Verification
              </p>
            </div>

            {/* Student photo — round, left aligned */}
            <div className="mb-5 pl-1">
              {data.photoUrl ? (
                <img
                  src={data.photoUrl}
                  alt={data.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}
              <div
                className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center border-2 border-gray-200 shadow"
                style={{ display: data.photoUrl ? 'none' : 'flex' }}
              >
                <span className="text-blue-600 font-bold text-xl">
                  {data.name?.[0] || 'S'}
                </span>
              </div>
            </div>

            {/* Details list */}
            <div className="space-y-2 text-xs">
              <DetailRow label="Name"            value={data.name}           isBlue />
              <DetailRow label="Registration Id" value={data.registrationId} />
              <DetailRow label="Programme"       value={shortProgramme(data.programme)} />
              <DetailRow label="Department"      value={data.department}     />
              <DetailRow label="Batch Year"      value={String(data.batchYear)} />
              <DetailRow label="Issued On"       value={formatDate(data.issuedOn)} nowrap />
            </div>

            {/* Login note — click here goes to the frontend login page */}
            <div className="mt-5">
              <p className="text-xs text-gray-500 italic text-center leading-relaxed">
                You don&apos;t have permission to view certificate,{' '}
                <a
                  href={loginUrl}
                  className="text-red-500 underline italic font-medium"
                >
                  click here
                </a>
                {' '}to login
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value, isBlue, nowrap }) {
  return (
    <div className="flex gap-2">
      <span className="font-bold text-gray-800 min-w-[105px] shrink-0">{label} :</span>
      <span
        className={[
          isBlue ? 'text-blue-500 font-medium' : 'text-gray-700',
          nowrap ? 'whitespace-nowrap' : '',
        ].join(' ')}
      >
        {value || '-'}
      </span>
    </div>
  )
}
