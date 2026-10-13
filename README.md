# 🔒 Lords University – Personal Digital Locker

A secure MERN stack personal digital locker for storing and accessing your degree certificate and marksheets.

---

## 🚀 How to Run

### Step 1 – Make sure MongoDB is running
```bash
brew services start mongodb-community
# OR
mongod
```

### Step 2 – Seed the database (one time only)
```bash
cd server
npm run seed
```
This creates your account and generates the QR code image at `server/uploads/qr/degree-qr.png`.

### Step 3 – Start the backend
```bash
cd server
node server.js
# Runs on http://localhost:5000
```

### Step 4 – Start the frontend
```bash
cd client
npm run dev
# Runs on http://localhost:5173
```

---

## 🔐 Login Credentials
| Field | Value |
|-------|-------|
| Registration ID | 4005 |
| Password | Sahil@2026 |

---

## 📱 Two Access Paths

### 1. Login → Dashboard
- Go to `http://localhost:5173/login`
- Enter Registration ID and Password
- Access all 6 semester marksheets with PDF download
- View your degree certificate details

### 2. QR Code Scan
- Scan the QR from `server/uploads/qr/degree-qr.png`
- Opens `http://localhost:5173/verify?token=...`
- Shows limited public info (no real degree photo)
- Login link at bottom to access full certificate

---

## 🛡️ Security Features
- Passwords hashed with **bcrypt** (12 rounds)
- **JWT** tokens (24hr expiry) for login sessions
- **QR tokens** signed with separate secret (permanent, revocable)
- **Rate limiting** – 5 login attempts per 15 min per IP
- **Helmet.js** – HTTP security headers
- Real degree photo path **never exposed** on QR verify route
- All student routes require valid JWT

---

## 📁 Folder Structure
```
Digital-lock/
├── client/                   # React + Vite + Tailwind CSS
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx     # Lords University login page
│       │   ├── Dashboard.jsx # Student dashboard
│       │   └── Verify.jsx    # QR scan landing page
│       ├── components/
│       │   └── ProtectedRoute.jsx
│       └── assets/
│           ├── logo.png      ← Lords University logo
│           └── login-bg.webp ← Campus background image
└── server/                   # Node.js + Express + MongoDB
    ├── server.js
    ├── seed.js               # Run once to populate DB
    ├── models/Student.js
    ├── routes/
    │   ├── auth.js           # POST /api/auth/login
    │   ├── student.js        # Protected student routes
    │   └── verify.js         # Public QR verification
    └── uploads/qr/           # Generated QR code image
```
