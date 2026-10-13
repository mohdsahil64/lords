import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  GraduationCap, FileText, Download, LogOut, Menu, X,
  TrendingUp, Shield, CheckCircle, Lock, Eye, ArrowLeft,
  CreditCard, User, Home, ChevronRight,
  AlertTriangle, CheckCircle2, IndianRupee,
  Award, RotateCcw, ClipboardList, Info, ExternalLink, Headphones
} from 'lucide-react'
import logo from '../assets/logo.png'
import userPhoto from '../assets/userdp.jpg'

const authGet = (path) => {
  const token = localStorage.getItem('token')
  return axios.get(path, { headers: { Authorization: `Bearer ${token}` } })
}

const gradeColor = (g) => {
  if (g === 'O')  return 'bg-gray-50 text-gray-800 border-gray-200'
  if (g === 'A+') return 'bg-green-50 text-green-700 border-green-200'
  if (g === 'A')  return 'bg-green-50 text-green-700 border-green-200'
  if (g === 'B+') return 'bg-gray-50 text-gray-700 border-gray-200'
  if (g === 'B')  return 'bg-gray-50 text-gray-700 border-gray-200'
  if (g === 'C')  return 'bg-gray-50 text-gray-600 border-gray-200'
  if (g === 'F')  return 'bg-red-50 text-red-700 border-red-200'
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

const yearOf = (s) => s <= 2 ? '2023–24' : s <= 4 ? '2024–25' : '2025–26'

const MAROON = '#8B1A1A'
const GRAD   = 'linear-gradient(135deg,#5C1A1A,#8B2A2A)'

// BCA programme: 5 subjects per sem × 6 sems = 30, plus 1 extra subject in sem 3 = 31 total
// Sahil: 25 backlogs across all 6 sems, all cleared via reappear

export default function Dashboard() {
  const navigate = useNavigate()
  const [student,    setStudent]    = useState(null)
  const [marksheets, setMarksheets] = useState([])
  const [fees,       setFees]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [navOpen,    setNavOpen]    = useState(false)
  const [page,       setPage]       = useState('home')
  const navRef = useRef(null)

  const [msStep, setMsStep] = useState('list')
  const [msSem,  setMsSem]  = useState(null)
  const [msData, setMsData] = useState(null)

  const [degStep,    setDegStep]    = useState('info')
  const [degreeData, setDegreeData] = useState(null)

  useEffect(() => {
    const outside = (e) => { if (navRef.current && !navRef.current.contains(e.target)) setNavOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setNavOpen(false) }
    document.addEventListener('mousedown', outside)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', esc) }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    Promise.all([
      authGet('/api/student/me'),
      authGet('/api/student/marksheets'),
      authGet('/api/student/fees'),
    ])
      .then(([s, m, f]) => {
        setStudent(s.data); setMarksheets(m.data); setFees(f.data)
        setLoading(false)
      })
      .catch(() => { localStorage.removeItem('token'); navigate('/login') })
  }, [navigate])

  const goTo = (p) => {
    setPage(p); setNavOpen(false)
    if (p === 'marksheets') { setMsStep('list'); setMsSem(null); setMsData(null) }
    if (p === 'degree')     { setDegStep('info') }
  }

  const selectSem = async (sem) => {
    setMsSem(sem)
    try {
      const res = await authGet('/api/student/marksheets')
      setMsData(res.data.find(m => m.semester === sem))
      setMsStep('view')
    } catch { alert('Failed to load marksheet.') }
  }
  const downloadPDF = async (sem) => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`/api/student/marksheet/${sem}/download`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `Lords_BCA_Sem${sem}_Marksheet.pdf`; a.click()
      window.URL.revokeObjectURL(url)
    } catch { alert('PDF download failed.') }
  }
  const loadAndViewDegree = async () => {
    if (!degreeData) {
      try { const r = await authGet('/api/student/degree'); setDegreeData(r.data) }
      catch { alert('Failed to load degree.'); return }
    }
    setDegStep('view')
  }
  const downloadDegree = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get('/api/student/degree/download', { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = 'Lords_BCA_Degree_Certificate.pdf'; a.click()
      window.URL.revokeObjectURL(url)
    } catch { alert('Degree PDF download failed.') }
  }
  const downloadReceipt = async (sem) => {
    const token = localStorage.getItem('token')
    try {
      const res = await axios.get(`/api/student/fee-receipt/${sem}/download`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = `Lords_BCA_Sem${sem}_Fee_Receipt.pdf`; a.click()
      window.URL.revokeObjectURL(url)
    } catch { alert('Fee receipt download failed.') }
  }
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login') }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-4 border-gray-200 border-t-[#8B1A1A] rounded-full animate-spin" />
        <p className="text-xs text-gray-400">Loading portal...</p>
      </div>
    </div>
  )

  const totalCGPA = marksheets.length ? marksheets[marksheets.length - 1].cgpa : null
  const paidFees  = fees.filter(f => f.status === 'Paid').reduce((s, f) => s + f.amount, 0)

  const NAV_ITEMS = [
    { id: 'home',       icon: <Home size={16} />,          label: 'Home'       },
    { id: 'profile',    icon: <User size={16} />,          label: 'Profile'    },
    { id: 'marksheets', icon: <FileText size={16} />,      label: 'Marksheets' },
    { id: 'degree',     icon: <GraduationCap size={16} />, label: 'Degree'     },
    { id: 'fees',       icon: <CreditCard size={16} />,    label: 'Fee'        },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo only — no text, slightly bigger */}
          <button onClick={() => goTo('home')} className="hover:opacity-75 transition flex-shrink-0">
            <img src={logo} alt="Lords University" className="h-8 w-auto object-contain" />
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map(n => (
              <button key={n.id} onClick={() => goTo(n.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  page === n.id ? 'text-[#8B1A1A] bg-red-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                {n.icon} {n.label}
              </button>
            ))}
          </nav>

          {/* Right: hamburger only */}
          <div className="relative flex-shrink-0" ref={navRef}>
            <button onClick={() => setNavOpen(!navOpen)}
              className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition"
              aria-label="Menu">
              <Menu size={18} />
            </button>

            {navOpen && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setNavOpen(false)} />}

            <div className={`fixed top-0 right-0 h-full bg-white z-50 flex flex-col transition-transform duration-300 ${navOpen ? 'translate-x-0' : 'translate-x-full'}`} style={{ width: 256, boxShadow: '-2px 0 20px rgba(0,0,0,0.12)' }}>

              {/* Header — just photo + name */}
              <div className="flex items-center justify-between px-4 py-4 flex-shrink-0" style={{ background: GRAD }}>
                <div className="flex items-center gap-3 min-w-0">
                  <img src={userPhoto} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-white/30 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm leading-tight">{student?.name}</p>
                    <p className="text-white/45 text-[10px] mt-0.5">Reg: {student?.registrationId}</p>
                    <p className="text-white/45 text-[10px] mt-0.5">Roll: {student?.rollNo}</p>
                  </div>
                </div>
                <button onClick={() => setNavOpen(false)} className="text-white/60 hover:text-white flex-shrink-0 ml-2 transition">
                  <X size={16} />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 py-3 overflow-y-auto">
                {NAV_ITEMS.map(n => (
                  <button key={n.id} onClick={() => goTo(n.id)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium transition ${
                      page === n.id
                        ? 'text-[#8B1A1A] bg-red-50 border-r-2 border-[#8B1A1A]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                    <span className={page === n.id ? 'text-[#8B1A1A]' : 'text-gray-400'}>{n.icon}</span>
                    {n.label}
                  </button>
                ))}

                {/* Support / Grievance link */}
                <div className="mx-5 my-2 border-t border-gray-100" />
                <a
                  href="https://lords.digiicampus.com/V2/#/helpCenter"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setNavOpen(false)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  <span className="text-gray-400"><Headphones size={16} /></span>
                  Contact Support
                  <ExternalLink size={11} className="ml-auto text-gray-300" />
                </a>
              </nav>

              {/* Sign out */}
              <div className="flex-shrink-0 p-4 border-t border-gray-100">
                <button onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition">
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 flex-1">

        {/* ══ HOME ══ */}
        {page === 'home' && (
          <div className="space-y-3">
            <HeroCard student={student} totalCGPA={totalCGPA} />

            {/* Stats strip */}
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Overall CGPA"  value={`${totalCGPA}/10`} sub="6 Semesters"   maroon />
              <MiniStat label="Degree"        value="Issued"           sub="Aug 21, 2026"  />
            </div>

            {/* Quick Access */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Quick Access</p>
              <div className="grid grid-cols-3 gap-2">
                <QCard icon={<FileText size={15} />}      label="Marksheets" onClick={() => goTo('marksheets')} />
                <QCard icon={<GraduationCap size={15} />} label="Degree"     onClick={() => goTo('degree')} />
                <QCard icon={<CreditCard size={15} />}    label="Fee"        onClick={() => goTo('fees')} />
              </div>
            </div>

            {/* Performance chart */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700">Academic Performance</p>
                <p className="text-[10px] text-gray-400">BCA 2023–26</p>
              </div>
              <div className="grid grid-cols-6 gap-1.5 items-end h-20">
                {marksheets.map(ms => {
                  const pct = (ms.sgpa / 10) * 100
                  return (
                    <div key={ms.semester} className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] font-bold text-[#8B1A1A]">{ms.sgpa}</span>
                      <div className="w-full rounded-t" style={{ height: `${pct * 0.6}px`, background: GRAD, minHeight: 6 }} />
                      <span className="text-[9px] text-gray-400">S{ms.semester}</span>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                <span className="text-[11px] text-gray-500">Final CGPA</span>
                <span className="text-sm font-bold text-[#8B1A1A]">{totalCGPA} / 10</span>
              </div>
            </div>
          </div>
        )}

        {/* ══ PROFILE ══ */}
        {page === 'profile' && (
          <div className="space-y-3">
            <SectionHeader title="My Profile" sub="Personal & academic information" icon={<User size={14} />} />

            {/* Identity card — compact */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  <img src={userPhoto} alt="Profile" className="w-14 h-14 rounded-xl object-cover border-3 border-white shadow flex-shrink-0" style={{ borderWidth: 3 }} />
                  <div className="pb-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">{student?.name}</p>
                    <p className="text-[11px] text-gray-500 leading-tight">{student?.programme}</p>
                  </div>
                </div>

                {/* Info list — flat rows, no colored boxes */}
                <div className="divide-y divide-gray-100">
                  <InfoLine label="Registration ID"  value={student?.registrationId} />
                  <InfoLine label="Enrollment No."   value={student?.enrollmentNo} />
                  <InfoLine label="Roll Number"      value={student?.rollNo} />
                  <InfoLine label="Programme"        value={student?.programme} />
                  <InfoLine label="Department"       value={student?.department} />
                  <InfoLine label="Batch"            value={`${student?.batchYear} – ${(student?.batchYear || 2023) + 3}`} />
                  <InfoLine label="Admission"        value={student?.admissionDate || 'August 2023'} />
                  <InfoLine label="Graduation"       value="August 21, 2026" />
                </div>
              </div>
            </div>

            {/* Academic summary — compact table-style */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-700 mb-3">Academic Summary</p>
              <div className="divide-y divide-gray-100">
                <SummaryLine label="Final CGPA"          value={`${totalCGPA} / 10`} />
                <SummaryLine label="Total Semesters"     value="6 of 6 completed" />
                <SummaryLine label="Total Papers (BCA)"  value="31 papers across 6 semesters" />
                <SummaryLine label="Total Backlogs"      value={`${student?.totalBacklogs} papers`} />
                <SummaryLine label="Backlogs Cleared"    value={`${student?.clearedBacklogs} backlogs cleared.`} green />
                <SummaryLine label="Total Fee Paid"      value="₹1,50,000 (₹25,000 × 6 sems)" />
                <SummaryLine label="Degree Issued"       value="21 August, 2026" green />
              </div>
            </div>

            {/* Backlog semester-wise summary — simple, no big boxes */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-700 mb-0.5">Backlog Summary</p>
              <p className="text-[11px] text-gray-400 mb-3">25 backlogs total</p>
              <div className="divide-y divide-gray-100">
                {marksheets.map(ms => (
                  <div key={ms.semester} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: GRAD }}>
                        S{ms.semester}
                      </span>
                      <span className="text-xs text-gray-600">Semester {ms.semester}</span>
                      <span className="text-[10px] text-gray-400">{yearOf(ms.semester)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      {ms.totalBacklogs > 0
                        ? <>
                            <span className="text-[11px] text-gray-500">{ms.totalBacklogs} back</span>
                            <CheckCircle2 size={12} className="text-green-600" />
                            <span className="text-[11px] text-green-600 font-medium">Cleared</span>
                          </>
                        : <span className="text-[11px] text-gray-400">No backlog</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-2">
                <CheckCircle2 size={13} className="text-green-600" />
                <p className="text-[11px] text-green-700 font-medium">All 25 backlogs cleared. </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ FEE ══ */}
        {page === 'fees' && (
          <div className="space-y-3">
            <SectionHeader title="Fee Management" sub="Semester-wise payment history" icon={<CreditCard size={14} />} />

            

            {/* Fee list */}
            <div className="space-y-2">
              {fees.map((fee) => (
                <div key={fee.semester} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: GRAD }}>S{fee.semester}</span>
                      <div>
                        <p className="text-xs font-semibold text-gray-800">Semester {fee.semester}</p>
                        <p className="text-[10px] text-gray-400">{yearOf(fee.semester)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">₹{fee.amount.toLocaleString('en-IN')}</p>
                        <span className="text-[10px] font-medium text-green-600">{fee.status} ✓</span>
                      </div>
                      {/* small download icon — per semester */}
                      <button onClick={() => downloadReceipt(fee.semester)} title={`Download Semester ${fee.semester} receipt`}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-[#8B1A1A] hover:bg-red-50 transition flex-shrink-0">
                        <Download size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-gray-400">Due</span><span className="text-gray-700 font-medium">{fee.dueDate}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Paid On</span><span className="text-gray-700 font-medium">{fee.paidDate}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Mode</span><span className="text-gray-700 font-medium">{fee.mode}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Receipt</span><span className="text-gray-700 font-medium truncate ml-1">{fee.receiptNo}</span></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-600">Fee Structure — BCA:</span> ₹25,000 per semester × 6 = ₹1,50,000 total. For queries: <span className="text-[#8B1A1A]">accounts@lordsuniversity.edu.in</span>
            </div>
          </div>
        )}

        {/* ══ EXAMS ══ */}

        {/* ══ MARKSHEETS ══ */}
        {page === 'marksheets' && (
          <>
            {msStep === 'list' && (
              <div className="space-y-2">
                <SectionHeader title="Marksheets" sub="Select semester to view or download" icon={<FileText size={14} />} />

                

                {[1,2,3,4,5,6].map(sem => {
                  const ms = marksheets.find(m => m.semester === sem)
                  return (
                    <button key={sem} onClick={() => selectSem(sem)}
                      className="w-full flex items-center justify-between bg-white rounded-xl px-3 py-3 shadow-sm border border-gray-100 hover:border-[#8B1A1A]/25 hover:shadow-md transition group text-left">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ background: GRAD }}>{sem}</span>
                        <div>
                          <p className="text-xs font-semibold text-gray-800">Semester {sem}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[10px] text-gray-400">{yearOf(sem)}</p>
                            {ms?.totalBacklogs > 0 && (
                              <span className="text-[9px] text-green-600 font-medium">{ms.totalBacklogs} back cleared ✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-[#8B1A1A]">{ms?.sgpa}</p>
                          <p className="text-[10px] text-gray-400">SGPA</p>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-[#8B1A1A] transition" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {msStep === 'view' && msData && (
              <div>
                <BackBtn onClick={() => setMsStep('list')} label="Back to Semesters" />
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* Compact header */}
                  <div className="px-4 py-3" style={{ background: GRAD }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white/50 text-[9px] uppercase tracking-wider">Lords University · Grade Sheet</p>
                        <p className="text-white font-bold text-sm mt-0.5">Semester {msSem} — {yearOf(msSem)}</p>
                        <p className="text-white/55 text-[10px]">{student?.name} · Roll: {student?.rollNo}</p>
                      </div>
                      <button onClick={() => downloadPDF(msSem)}
                        className="flex-shrink-0 flex items-center gap-1 bg-white text-[#8B1A1A] text-[11px] font-bold px-2.5 py-1.5 rounded-lg hover:bg-white/90 transition">
                        <Download size={11} /> PDF
                      </button>
                    </div>
                    {/* Pills row */}
                    <div className="flex gap-1.5 mt-2.5 flex-wrap">
                      <span className="text-[10px] bg-white/15 text-white px-2 py-1 rounded-md">SGPA <strong>{msData.sgpa}</strong></span>
                      <span className="text-[10px] bg-white/15 text-white px-2 py-1 rounded-md">CGPA <strong>{msData.cgpa}</strong></span>
                      <span className="text-[10px] bg-white/15 text-green-300 px-2 py-1 rounded-md font-semibold">PASS ✓</span>
                      {msData.totalBacklogs > 0 && (
                        <span className="text-[10px] bg-white/15 text-green-300 px-2 py-1 rounded-md font-semibold">{msData.totalBacklogs} back cleared ✓</span>
                      )}
                    </div>
                  </div>

                  {/* Student info — 2-col compact */}
                  <div className="grid grid-cols-2 border-b border-gray-100 text-[10px]">
                    <div className="px-3 py-2 border-r border-gray-100">
                      <p className="text-gray-400 uppercase tracking-wider">Enrollment</p>
                      <p className="font-semibold text-gray-700 mt-0.5">{student?.enrollmentNo}</p>
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-gray-400 uppercase tracking-wider">Programme</p>
                      <p className="font-semibold text-gray-700 mt-0.5">BCA · {student?.batchYear}–{(student?.batchYear||2023)+3}</p>
                    </div>
                  </div>

                  {/* Backlog notice — only if applicable */}
                  {msData.totalBacklogs > 0 && (
                    <div className="mx-3 mt-2.5 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle size={11} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-amber-700 leading-snug">
                        <strong>{msData.totalBacklogs} Backlogs </strong><strong>{msData.result}</strong>
                      </p>
                    </div>
                  )}

                  {/* Subjects table — compact */}
                  <div className="px-3 pt-2.5 pb-4">
                    <div className="rounded-lg border border-gray-100 overflow-hidden">
                      <table className="w-full" style={{ fontSize: 11 }}>
                        <thead>
                          <tr style={{ background: 'rgba(92,26,26,0.06)' }}>
                            <th className="text-left text-[9px] text-gray-500 font-semibold px-2 py-2 w-6">#</th>
                            <th className="text-left text-[9px] text-gray-500 font-semibold px-2 py-2">Subject</th>
                            <th className="text-center text-[9px] text-gray-500 font-semibold px-1.5 py-2 w-9">Max</th>
                            <th className="text-center text-[9px] text-gray-500 font-semibold px-1.5 py-2 w-11">Marks</th>
                            <th className="text-center text-[9px] text-gray-500 font-semibold px-1.5 py-2 w-11">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {msData.subjects.map((sub, i) => (
                            <tr key={i} className={`border-t border-gray-50 ${i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}`}>
                              <td className="px-2 py-2 text-[10px] text-gray-400">{i+1}</td>
                              <td className="px-2 py-2 text-gray-700 leading-snug">
                                <span className="text-[11px]">{sub.name}</span>
                                {sub.isBacklog && (
                                  <span className="ml-1 text-[8px] text-green-600 font-bold bg-green-50 border border-green-200 px-1 py-0.5 rounded">RA✓</span>
                                )}
                              </td>
                              <td className="px-1.5 py-2 text-center text-gray-400 text-[10px]">{sub.total}</td>
                              <td className="px-1.5 py-2 text-center font-bold text-gray-800 text-[11px]">{sub.marks}</td>
                              <td className="px-1.5 py-2 text-center">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${gradeColor(sub.grade)}`}>{sub.grade}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-wrap gap-4 mt-2.5 pt-2.5 border-t border-gray-100 text-xs">
                      <span className="text-gray-500">SGPA: <strong className="text-[#8B1A1A]">{msData.sgpa}</strong></span>
                      <span className="text-gray-500">CGPA: <strong className="text-gray-800">{msData.cgpa}</strong></span>
                      <span className="text-gray-500">Result: <strong className="text-green-600">{msData.result || 'PASS'}</strong></span>
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1">Reappear Exam · Backlog cleared via supplementary examination</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ DEGREE ══ */}
        {page === 'degree' && (
          <>
            {degStep === 'info' && (
              <div className="max-w-md mx-auto space-y-3">
                <SectionHeader title="Degree Certificate" sub="Bachelor of Computer Applications" icon={<GraduationCap size={14} />} />

                

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-5 text-center border-b border-gray-100">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: GRAD }}>
                      <GraduationCap size={26} className="text-white" />
                    </div>
                    <p className="font-semibold text-gray-800">Degree Certificate</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Lords University · Class of 2026</p>
                  </div>
                  <div className="px-4 py-3 divide-y divide-gray-100">
                    <InfoLine label="Name"          value={student?.name} />
                    <InfoLine label="Programme"     value="Bachelor of Computer Applications" />
                    <InfoLine label="Department"    value={student?.department} />
                    <InfoLine label="Enrollment"    value={student?.enrollmentNo} />
                    <InfoLine label="Batch"         value={`${student?.batchYear} – ${(student?.batchYear||2023)+3}`} />
                    <InfoLine label="Issued On"     value="August 21, 2026" />
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100">
                    <button onClick={downloadDegree} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold text-white transition hover:opacity-90" style={{ background: GRAD }}>
                      <Download size={15} /> Download Degree Certificate PDF
                    </button>
                  </div>
                </div>
              </div>
            )}

            {degStep === 'confirm' && (
              <div className="max-w-lg mx-auto">
                <BackBtn onClick={() => setDegStep('info')} label="Back" />

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4" style={{ background: GRAD }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                        <GraduationCap size={22} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white/55 text-[10px] uppercase tracking-wider">Official Certificate</p>
                        <p className="text-white font-bold text-base leading-tight">Degree Certificate</p>
                        <p className="text-white/55 text-[11px] mt-0.5">Bachelor of Computer Applications · 2026</p>
                      </div>
                    </div>
                  </div>

                  {/* Student info strip */}
                  <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 border-b border-gray-100">
                    <div className="px-4 py-3">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Certificate Holder</p>
                      <p className="text-xs font-semibold text-gray-800">{student?.name}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Enrollment No.</p>
                      <p className="text-xs font-semibold text-gray-800">{student?.enrollmentNo}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Issued On</p>
                      <p className="text-xs font-semibold text-gray-800">August 21, 2026</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Issuing Authority</p>
                      <p className="text-xs font-semibold text-gray-800">Lords University</p>
                    </div>
                  </div>

                  
                  <div className="mx-5 mb-4 flex items-start gap-2.5 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <Shield size={13} className="text-gray-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-500 leading-snug">
                      This is an officially issued digital degree certificate. It includes a QR code for instant third-party verification. Download the PDF for the complete signed document.
                    </p>
                  </div>

                  <div className="px-5 pb-5 flex gap-3">
                    <button onClick={() => setDegStep('info')}
                      className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                      Cancel
                    </button>
                    <button onClick={loadAndViewDegree}
                      className="flex-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ background: GRAD, minWidth: 0, flex: 2 }}>
                      <Eye size={15} /> Open Certificate
                    </button>
                  </div>
                </div>
              </div>
            )}

            {degStep === 'view' && degreeData && (
              <div className="max-w-md mx-auto">
                <BackBtn onClick={() => setDegStep('info')} label="Back" />

                <div className="bg-white rounded-xl shadow-md border-2 overflow-hidden mb-3 relative" style={{ borderColor: MAROON }}>
                  {/* Gold side strip */}
                  <div className="absolute left-0 top-0 bottom-0 w-2.5 flex flex-col">
                    {Array.from({length:12}).map((_,i) => (
                      <div key={i} className="flex-1" style={{ background: i%2===0 ? '#D4AF37' : '#B8960C' }} />
                    ))}
                  </div>
                  {/* Watermark */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
                    {Array.from({length:4}).map((_,i) => (
                      <div key={i} className="absolute font-black whitespace-nowrap text-gray-200" style={{ fontSize:'2rem', top:`${i*24}%`, left:'-8%', transform:'rotate(-15deg)', opacity:0.25 }}>
                        LORDS UNIVERSITY
                      </div>
                    ))}
                  </div>

                  <div className="pl-6 pr-4 py-5 relative z-10">
                    <div className="flex justify-between text-[9px] text-gray-400 font-mono mb-3">
                      <div><div>Serial: {degreeData.serialNo}</div><div>Roll: {degreeData.rollNo}</div></div>
                      <div className="text-right"><div>{degreeData.enrollmentNo}</div></div>
                    </div>
                    <div className="text-center mb-4">
                      <img src={logo} alt="Lords University" className="w-10 h-10 object-contain mx-auto mb-1" />
                      <h1 className="font-black tracking-widest text-xl leading-tight" style={{ color:'#5C1A1A', fontFamily:'Georgia,serif' }}>LORDS</h1>
                      <h2 className="font-bold tracking-widest text-base" style={{ color:'#5C1A1A', fontFamily:'Georgia,serif' }}>UNIVERSITY</h2>
                      <p className="text-[10px] font-medium mt-0.5" style={{ color:'#B8960C' }}>लॉर्ड्स विश्वविद्यालय</p>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1 h-px bg-amber-300" />
                      <span className="text-[9px] font-bold tracking-widest text-amber-600">DEGREE CERTIFICATE</span>
                      <div className="flex-1 h-px bg-amber-300" />
                    </div>
                    <div className="text-center text-xs text-gray-700 space-y-1.5">
                      <p>This is to certify that</p>
                      <p className="text-lg font-bold text-gray-900" style={{ fontFamily:'Georgia,serif' }}>{degreeData.name}</p>
                      <p>has been conferred the Degree of</p>
                      <p className="text-sm font-bold" style={{ color:MAROON }}>Bachelor of Computer Applications</p>
                      <p className="text-[10px] text-gray-500 px-2 leading-relaxed">on successful completion of all prescribed requirements. University Examinations, Year <strong>2026</strong>.</p>
                    </div>
                    <div className="flex justify-center mt-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold" style={{ color:MAROON, borderColor:'rgba(139,26,26,0.25)', background:'rgba(139,26,26,0.04)' }}>
                        <Award size={11} /> CGPA: {totalCGPA} / 10
                      </div>
                    </div>
                    <div className="flex justify-between items-end mt-5 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-xl italic text-gray-400 mb-0.5">𝒥</div>
                        <p className="text-[9px] font-medium text-gray-600">Registrar</p>
                        <p className="text-[9px] text-gray-400">Aug 21, 2026</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl italic text-gray-400 mb-0.5">𝒦</div>
                        <p className="text-[9px] font-medium text-gray-600">Vice Chancellor</p>
                      </div>
                      <div className="text-center">
                        <div className="text-xl italic text-gray-400 mb-0.5">𝒫</div>
                        <p className="text-[9px] font-medium text-gray-600">President</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button onClick={downloadDegree} className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-white py-3 rounded-xl transition hover:opacity-90 mb-2.5" style={{ background: GRAD }}>
                  <Download size={14} /> Download Degree Certificate PDF
                </button>
                <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-500">
                  <Shield size={12} className="mt-0.5 flex-shrink-0" />
                  <span>Original degree photo stored securely. Download the PDF for the complete official document with QR verification.</span>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img src={logo} alt="Lords University" className="w-7 h-7 object-contain" />
                <span className="font-semibold text-gray-700 text-xs">Lords University</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">Student Portal — Digital Academic Locker. Lords University, Alwar, Rajasthan.</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Links</p>
              <ul className="space-y-1">
                {[['Privacy Policy','#'],['Terms of Use','#'],['Grievance Portal','https://lords.digiicampus.com'],['University Website','https://lordsuniversity.edu.in']].map(([l,h]) => (
                  <li key={l}><a href={h} target={h!=='#'?'_blank':undefined} rel="noopener noreferrer" className="text-[11px] text-gray-500 hover:text-[#8B1A1A] transition flex items-center gap-1">{l}{h!=='#'&&<ExternalLink size={9}/>}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Support</p>
              <div className="space-y-1.5 text-[11px] text-gray-500">
                <p>✉ <a href="mailto:support@lordsuniversity.edu.in" className="hover:text-[#8B1A1A] transition">support@lordsuniversity.edu.in</a></p>
                <p>✉ <a href="mailto:examination@lordsuniversity.edu.in" className="hover:text-[#8B1A1A] transition">examination@lordsuniversity.edu.in</a></p>
                <p>📞 <a href="tel:+911441234567" className="hover:text-[#8B1A1A] transition">+91 144 123 4567</a></p>
                <p>🕐 Mon–Sat, 9:00 AM – 5:00 PM</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-[10px] text-gray-400 leading-relaxed mb-2">
              <strong className="text-gray-500">Privacy:</strong> Student data including marksheets, degree, fee records and personal information are stored securely. Not shared with third parties. Contact: <a href="mailto:privacy@lordsuniversity.edu.in" className="text-[#8B1A1A] hover:underline">privacy@lordsuniversity.edu.in</a>
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <p className="text-[10px] text-gray-400">© {new Date().getFullYear()} Lords University. All rights reserved. Portal v2.0</p>
              <div className="flex items-center gap-1">
                <Shield size={10} className="text-green-500" />
                <p className="text-[10px] text-gray-400">256-bit SSL Secured</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ── Tiny reusable components ─────────────────────────────────────────────── */

function HeroCard({ student, totalCGPA }) {
  return (
    <div className="rounded-xl overflow-hidden relative" style={{ background: GRAD, boxShadow: '0 3px 16px rgba(92,26,26,0.22)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {[...Array(3)].map((_,i) => (
          <div key={i} className="absolute text-white font-black whitespace-nowrap leading-none" style={{ fontSize:'2.5rem', top:`${i*40-5}%`, left:'-5%', transform:'rotate(-15deg)', opacity:0.04 }}>
            LORDS UNIVERSITY &nbsp; LORDS UNIVERSITY
          </div>
        ))}
      </div>
      <div className="absolute left-0 top-0 bottom-0 w-2.5 flex flex-col">
        {[...Array(8)].map((_,i) => <div key={i} className="flex-1" style={{ background: i%2===0 ? '#D4AF37' : '#B8960C' }} />)}
      </div>
      <div className="pl-6 pr-3 pt-3 pb-4 relative z-10">
        <div className="flex justify-between text-[9px] text-white/40 font-mono mb-2.5">
          <span>2023 – 2026</span>
          <span className="truncate ml-2">{student?.enrollmentNo}</span>
        </div>
        <div className="flex items-center gap-2.5 mb-3">
          <img src={userPhoto} alt="Profile" className="w-11 h-11 rounded-full object-cover border-2 flex-shrink-0" style={{ borderColor: 'rgba(212,175,55,0.5)' }} />
          <div className="min-w-0 flex-1">
            <p className="text-white/65 text-[10px]">Welcome back,</p>
            <h1 className="text-white text-base font-bold leading-tight" style={{ fontFamily:'Georgia,serif' }}>{student?.name}</h1>
            <p className="text-white/55 text-[10px] mt-0.5 leading-snug">{student?.programme}</p>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Chip label="ROLL" value={student?.rollNo} />
          <Chip label="REG." value={student?.registrationId} />
          <Chip label="BATCH" value={`${student?.batchYear}–${(student?.batchYear||2023)+3}`} />
          {totalCGPA && <Chip label="CGPA" value={`${totalCGPA}/10`} gold />}
        </div>
      </div>
    </div>
  )
}

function Chip({ label, value, gold }) {
  return (
    <div className="rounded-md px-2 py-1 flex-shrink-0" style={{ background:'rgba(255,255,255,0.12)' }}>
      <p className="text-[8px] text-white/45 uppercase leading-none mb-0.5">{label}</p>
      <p className={`text-[11px] font-bold leading-none ${gold ? 'text-yellow-300' : 'text-white'}`}>{value}</p>
    </div>
  )
}

function MiniStat({ label, value, sub, maroon, green }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
      <p className="text-[10px] text-gray-400 leading-tight">{label}</p>
      <p className={`text-sm font-bold leading-tight mt-0.5 ${maroon ? 'text-[#8B1A1A]' : green ? 'text-green-600' : 'text-gray-800'}`}>{value}</p>
      <p className="text-[10px] text-gray-400 leading-tight">{sub}</p>
    </div>
  )
}

function QCard({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-left hover:shadow-md hover:border-gray-200 transition group flex flex-col items-center gap-1.5">
      <span className="text-[#8B1A1A] group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">{label}</span>
    </button>
  )
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-start justify-between py-2 gap-3">
      <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex-shrink-0 w-24">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right leading-snug break-all">{value || '—'}</span>
    </div>
  )
}

function SummaryLine({ label, value, green }) {
  return (
    <div className="flex items-center justify-between py-2 gap-3">
      <span className="text-[11px] text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-[11px] font-semibold text-right ${green ? 'text-green-600' : 'text-gray-800'}`}>{value}</span>
    </div>
  )
}

function Row3({ label, value, green }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${green ? 'text-green-600' : 'text-[#8B1A1A]'}`}>{value}</span>
    </div>
  )
}

function EligRow({ label, done }) {
  return (
    <div className="flex items-center gap-2.5">
      {done ? <CheckCircle2 size={13} className="text-green-600 flex-shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 flex-shrink-0" />}
      <span className="text-xs text-gray-700">{label}</span>
    </div>
  )
}

function StepRow({ text, done }) {
  return (
    <div className="flex items-start gap-2.5">
      {done
        ? <CheckCircle size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
        : <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-gray-300 flex-shrink-0 mt-0.5" />
      }
      <p className={`text-xs leading-snug ${done ? 'text-gray-600' : 'text-gray-400'}`}>{text}</p>
    </div>
  )
}

function SectionHeader({ title, sub, icon }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[#8B1A1A]">{icon}</span>
      <div>
        <h2 className="font-bold text-gray-800 text-sm leading-tight">{title}</h2>
        {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
      </div>
    </div>
  )
}

function BackBtn({ onClick, label }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-[#8B1A1A] mb-3 transition">
      <ArrowLeft size={12} /> {label}
    </button>
  )
}
