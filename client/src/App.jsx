import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Verify from './pages/Verify'
import PublicCertificate from './pages/PublicCertificate'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  // The degree QR opens  <base>/V2/#/public-certificate?id=...  — a hash route.
  // Render the public verification page directly for that hash so it works no
  // matter what the browser path/base is, without disturbing the other routes.
  const hashPath = (window.location.hash || '').replace(/^#/, '')
  if (hashPath.startsWith('/public-certificate')) {
    return <PublicCertificate />
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
