import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Point every axios call at the backend API.
//
//  - In development  VITE_API_URL is empty, so requests stay relative
//    ("/api/...") and Vite's dev proxy forwards them to localhost:5000.
//  - In production   set VITE_API_URL to the backend's full origin
//    (e.g. "https://api.yourdomain.com"). All "/api/..." calls then go
//    straight to the VPS backend instead of the Vercel frontend domain.
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
